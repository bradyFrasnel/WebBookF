import net from "node:net";
import tls from "node:tls";
import crypto from "node:crypto";

const ALLOWED_SMTP_HOSTS = new Set([
  "smtp.gmail.com",
  "smtp.googlemail.com",
  "smtp-mail.outlook.com",
  "smtp.office365.com",
  "smtp.mail.yahoo.com",
]);

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const JWT_REGEX = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

function encodeHeaderUtf8(text) {
  return `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

function toMimeBase64(text) {
  const b64 = Buffer.from(text, "utf8").toString("base64");
  return b64.replace(/(.{76})/g, "$1\r\n").trim();
}

function validateResetJwt(token, expectedEmail) {
  if (!token || typeof token !== "string" || !JWT_REGEX.test(token)) {
    return false;
  }
  try {
    const parts = token.split(".");
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson);
    const nowSec = Math.floor(Date.now() / 1000);

    if (payload.type !== "password_reset") return false;
    if (
      typeof payload.sub !== "string" ||
      payload.sub.trim().toLowerCase() !== expectedEmail.toLowerCase()
    ) {
      return false;
    }
    if (typeof payload.exp !== "number" || payload.exp <= nowSec) {
      return false;
    }
    if (
      typeof payload.iat === "number" &&
      Math.abs(nowSec - payload.iat) > 600
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function createLineReader(socket) {
  let buffer = "";
  let pendingResolve = null;
  let pendingReject = null;
  let storedError = null;
  const collected = [];
  const responseQueue = [];

  const onData = (chunk) => {
    buffer += chunk.toString("utf8");
    let idx;
    while ((idx = buffer.indexOf("\r\n")) !== -1) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      collected.push(line);

      // En SMTP, la dernière ligne d'une réponse a un espace (ou fin de ligne) après les 3 chiffres
      if (/^\d{3}(?: |$)/.test(line)) {
        const code = Number(line.slice(0, 3));
        const text = collected.splice(0, collected.length).join("\n");
        if (pendingResolve) {
          const resolve = pendingResolve;
          pendingResolve = null;
          pendingReject = null;
          resolve({ code, text });
        } else {
          responseQueue.push({ code, text });
        }
      }
    }
  };

  const onError = (err) => {
    if (pendingReject) {
      const reject = pendingReject;
      pendingResolve = null;
      pendingReject = null;
      reject(err);
    } else {
      storedError = err;
    }
  };

  const onClose = () => {
    const closeErr = new Error("Connexion SMTP fermée prématurément.");
    if (pendingReject) {
      const reject = pendingReject;
      pendingResolve = null;
      pendingReject = null;
      reject(closeErr);
    } else if (!storedError) {
      storedError = closeErr;
    }
  };

  socket.on("data", onData);
  socket.on("error", onError);
  socket.on("close", onClose);

  return {
    readResponse(timeoutMs = 10000) {
      if (responseQueue.length > 0) {
        return Promise.resolve(responseQueue.shift());
      }
      if (storedError) {
        const err = storedError;
        storedError = null;
        return Promise.reject(err);
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pendingResolve = null;
          pendingReject = null;
          reject(new Error("Délai d'attente SMTP dépassé."));
        }, timeoutMs);

        pendingResolve = (res) => {
          clearTimeout(timer);
          resolve(res);
        };
        pendingReject = (err) => {
          clearTimeout(timer);
          reject(err);
        };
      });
    },
    detach() {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
    },
  };
}

async function sendCommand(socket, reader, cmd, expectedCodes) {
  socket.write(`${cmd}\r\n`);
  const res = await reader.readResponse();
  if (!expectedCodes.includes(res.code)) {
    const err = new Error(`Erreur SMTP (${res.code}): ${res.text}`);
    err.smtpCode = res.code;
    throw err;
  }
  return res;
}

async function sendViaSmtp({
  smtpHost,
  smtpPort,
  smtpUser,
  smtpPassword,
  fromName,
  fromEmail,
  toEmail,
  subject,
  textContent,
  htmlContent,
}) {
  let socket = null;
  let reader = null;

  try {
    if (smtpPort === 465) {
      socket = await new Promise((resolve, reject) => {
        const tlsSocket = tls.connect(
          {
            host: smtpHost,
            port: smtpPort,
            servername: smtpHost,
            minVersion: "TLSv1.2",
          },
          () => resolve(tlsSocket)
        );
        reader = createLineReader(tlsSocket);
        tlsSocket.once("error", reject);
      });
      const greeting = await reader.readResponse();
      if (greeting.code !== 220) {
        throw new Error(`Salutation SMTP invalide (${greeting.code})`);
      }
      await sendCommand(socket, reader, "EHLO webbook.app", [250]);
    } else {
      const plainSocket = await new Promise((resolve, reject) => {
        const netSocket = net.connect({ host: smtpHost, port: smtpPort }, () =>
          resolve(netSocket)
        );
        reader = createLineReader(netSocket);
        netSocket.once("error", reject);
      });
      const greeting = await reader.readResponse();
      if (greeting.code !== 220) {
        throw new Error(`Salutation SMTP invalide (${greeting.code})`);
      }
      await sendCommand(plainSocket, reader, "EHLO webbook.app", [250]);
      await sendCommand(plainSocket, reader, "STARTTLS", [220]);
      reader.detach();

      socket = await new Promise((resolve, reject) => {
        const tlsSocket = tls.connect(
          {
            socket: plainSocket,
            servername: smtpHost,
            minVersion: "TLSv1.2",
          },
          () => resolve(tlsSocket)
        );
        reader = createLineReader(tlsSocket);
        tlsSocket.once("error", reject);
      });
      await sendCommand(socket, reader, "EHLO webbook.app", [250]);
    }

    const authPlain = Buffer.from(
      `\u0000${smtpUser}\u0000${smtpPassword}`,
      "utf8"
    ).toString("base64");
    await sendCommand(socket, reader, `AUTH PLAIN ${authPlain}`, [235]);

    await sendCommand(socket, reader, `MAIL FROM:<${fromEmail}>`, [250]);
    await sendCommand(socket, reader, `RCPT TO:<${toEmail}>`, [250, 251]);
    await sendCommand(socket, reader, "DATA", [354]);

    const boundary = `----WebBookBoundary_${crypto.randomBytes(12).toString("hex")}`;
    const domainPart = fromEmail.split("@")[1] || "webbook.app";
    const messageLines = [
      `From: ${encodeHeaderUtf8(fromName)} <${fromEmail}>`,
      `To: <${toEmail}>`,
      `Subject: ${encodeHeaderUtf8(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${crypto.randomUUID()}@${domainPart}>`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      toMimeBase64(textContent),
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      toMimeBase64(htmlContent),
      "",
      `--${boundary}--`,
      ".",
    ];

    await sendCommand(socket, reader, messageLines.join("\r\n"), [250]);

    try {
      socket.write("QUIT\r\n");
    } catch {
      // ignore
    }
  } finally {
    if (reader) reader.detach();
    if (socket) socket.destroy();
  }
}

const ipHits = new Map();

function checkRelayRateLimit(ip, maxReqs = 8, windowMs = 300_000) {
  const now = Date.now();
  const list = (ipHits.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (list.length >= maxReqs) {
    ipHits.set(ip, list);
    return false;
  }
  list.push(now);
  ipHits.set(ip, list);
  return true;
}

export default async function handler(req, res) {
  if (typeof res.setHeader === "function") {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Méthode non autorisée." });
  }

  const clientIp =
    (req.headers?.["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (!checkRelayRateLimit(clientIp)) {
    return res
      .status(429)
      .json({ detail: "Trop de requêtes d'envoi d'email. Veuillez patienter." });
  }

  try {
    const rawStr = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    if (rawStr.length > 16384) {
      return res.status(413).json({ detail: "Charge utile trop volumineuse." });
    }
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const toEmail = String(body.to_email || "").trim().toLowerCase();
    const resetToken = String(body.reset_token || "").trim();
    const expireMinutes = Math.min(
      Math.max(Number(body.expire_minutes) || 30, 5),
      120
    );
    const smtpHost = String(body.smtp_host || "smtp.gmail.com").trim().toLowerCase();
    const smtpPort = Number(body.smtp_port) === 587 ? 587 : 465;
    const smtpUser = String(body.smtp_user || "").trim();
    const smtpPassword = String(body.smtp_password || "").replace(/\s+/g, "");
    const fromName = String(body.from_name || "WebBook")
      .replace(/[\r\n]/g, "")
      .slice(0, 60);
    const fromEmail = String(body.from_email || smtpUser).trim();

    if (!EMAIL_REGEX.test(toEmail) || !EMAIL_REGEX.test(fromEmail)) {
      return res.status(400).json({ detail: "Adresse email invalide." });
    }

    if (!ALLOWED_SMTP_HOSTS.has(smtpHost)) {
      return res.status(400).json({ detail: "Hôte SMTP non autorisé." });
    }

    if (!smtpUser || !smtpPassword) {
      return res.status(400).json({ detail: "Identifiants SMTP manquants." });
    }

    if (!validateResetJwt(resetToken, toEmail)) {
      return res.status(403).json({ detail: "Jeton de réinitialisation invalide." });
    }

    const resetUrl = `https://webbookf.vercel.app/reinitialiser-mot-de-passe?token=${encodeURIComponent(
      resetToken
    )}`;
    const subject = "Réinitialisation de votre mot de passe WebBook";

    const textContent = [
      "Bonjour,",
      "",
      "Vous avez demandé la réinitialisation du mot de passe de votre compte WebBook.",
      "Veuillez ouvrir le lien ci-dessous dans votre navigateur pour définir un nouveau mot de passe :",
      "",
      resetUrl,
      "",
      `Ce lien est valable pendant ${expireMinutes} minutes.`,
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.",
      "",
      "L'équipe WebBook",
    ].join("\n");

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a; background-color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 26px; font-weight: 800;">WebBook</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Votre carnet personnel de favoris &amp; mémos</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Demande de réinitialisation</h2>
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">
            Vous avez demandé la réinitialisation du mot de passe de votre compte WebBook. Cliquez sur le bouton ci-dessous pour en définir un nouveau :
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            Ce lien est valable pendant <strong>${expireMinutes} minutes</strong>. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
          </p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">
            Si le bouton ne fonctionne pas, copiez-collez cette adresse dans votre navigateur :<br />
            <a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a>
          </p>
        </div>
      </div>
    `;

    await sendViaSmtp({
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      fromName,
      fromEmail,
      toEmail,
      subject,
      textContent,
      htmlContent,
    });

    return res.status(200).json({ status: "sent" });
  } catch (err) {
    console.error("Erreur relais SMTP WebBook:", err?.message || err);
    const status = err?.smtpCode === 535 ? 401 : 502;
    return res.status(status).json({
      detail:
        err?.smtpCode === 535
          ? "Identifiants SMTP refusés par Google (vérifiez SMTP_USER et le mot de passe d'application SMTP_PASSWORD)."
          : "Échec de l'envoi de l'email via le serveur SMTP.",
    });
  }
}
