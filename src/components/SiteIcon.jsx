import React, { useEffect, useState } from "react";

function isLocalOrIpHostname(hostname) {
  if (!hostname) return true;
  const h = hostname.toLowerCase();
  if (
    h === "localhost" ||
    h === "::1" ||
    h.endsWith(".local") ||
    h.endsWith(".localhost") ||
    h.endsWith(".test") ||
    h.endsWith(".internal")
  ) {
    return true;
  }
  // IPv4 (ex: 127.0.0.1, 192.168.1.1, etc.)
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
    return true;
  }
  // IPv6
  if (h.includes(":")) {
    return true;
  }
  return !h.includes(".");
}

function resolveSafeFaviconSrc(iconeUrl, siteUrl) {
  if (iconeUrl) {
    try {
      const parsedIcon = new URL(iconeUrl);
      // Si c'est une URL Google Favicons pointant vers un domaine local/IP (ex: domain=127.0.0.1), on l'ignore pour éviter une 404
      if (parsedIcon.hostname.includes("google.com") && parsedIcon.searchParams.has("domain")) {
        const targetDomain = parsedIcon.searchParams.get("domain");
        try {
          const host = targetDomain.includes("://")
            ? new URL(targetDomain).hostname
            : targetDomain.split(":")[0];
          if (isLocalOrIpHostname(host)) {
            return null;
          }
        } catch {
          return null;
        }
      }
      return iconeUrl;
    } catch {
      return null;
    }
  }

  if (siteUrl) {
    try {
      const parsedSite = new URL(
        siteUrl.includes("://") ? siteUrl : `https://${siteUrl}`
      );
      if (isLocalOrIpHostname(parsedSite.hostname)) {
        return null;
      }
      return `https://www.google.com/s2/favicons?domain=${parsedSite.hostname}&sz=64`;
    } catch {
      return null;
    }
  }

  return null;
}

export default function SiteIcon({ nom, url, iconeUrl, size = 42 }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url, iconeUrl]);

  const initial = (nom || url || "W").trim().charAt(0).toUpperCase();
  const src = resolveSafeFaviconSrc(iconeUrl, url);

  if (!src || failed) {
    return (
      <div
        className="site-icon-fallback"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
        aria-label={nom}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Icône ${nom}`}
      className="site-icon-img"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
