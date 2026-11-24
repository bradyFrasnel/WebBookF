import React, { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Sun,
  Moon,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { authApi } from "../services/api";
import PrivacyModal from "../components/PrivacyModal";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_SECONDS = 300; // 5 minutes
const LOCK_UNTIL_KEY = "webbook_login_lock_until";
const FAILED_COUNT_KEY = "webbook_login_failed_count";
const FAILED_WINDOW_KEY = "webbook_login_first_fail_ts";

function getRemainingLockSeconds() {
  try {
    const until = Number(localStorage.getItem(LOCK_UNTIL_KEY) || 0);
    if (until > Date.now()) {
      return Math.ceil((until - Date.now()) / 1000);
    }
    if (until > 0) {
      localStorage.removeItem(LOCK_UNTIL_KEY);
      localStorage.removeItem(FAILED_COUNT_KEY);
      localStorage.removeItem(FAILED_WINDOW_KEY);
    }
  } catch {
    // ignore
  }
  return 0;
}

function formatCountdown(totalSec) {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState(() =>
    searchParams.get("mode") === "register" ? "register" : "login"
  );
  const [email, setEmail] = useState("");
  const [nomUtilisateur, setNomUtilisateur] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(() =>
    getRemainingLockSeconds()
  );

  useEffect(() => {
    if (lockSecondsLeft <= 0) return undefined;
    const timer = setInterval(() => {
      const rem = getRemainingLockSeconds();
      setLockSecondsLeft(rem);
      if (rem === 0) {
        setError("");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockSecondsLeft]);

  const activateLockout = (durationSec = LOGIN_LOCKOUT_SECONDS) => {
    const safeSec = Math.max(1, durationSec);
    try {
      localStorage.setItem(LOCK_UNTIL_KEY, String(Date.now() + safeSec * 1000));
      localStorage.removeItem(FAILED_COUNT_KEY);
      localStorage.removeItem(FAILED_WINDOW_KEY);
    } catch {
      // ignore
    }
    setLockSecondsLeft(safeSec);
  };

  if (user) {
    return <Navigate to="/sites" replace />;
  }

  const isLoginLocked = mode === "login" && lockSecondsLeft > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoginLocked) return;
    setError("");
    setSuccessMsg("");

    if (mode === "forgot") {
      setSubmitting(true);
      const emailClean = email.trim().toLowerCase();
      try {
        await authApi.forgotPassword(emailClean);
        setSuccessMsg(`Un lien vous a été envoyé à l'adresse ${emailClean}.`);
      } catch (err) {
        setError(err.message || "Erreur lors de l'envoi de l'email.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === "register" && !privacyAccepted) {
      setError(
        "Veuillez accepter la politique de confidentialité pour créer votre compte."
      );
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, motDePasse);
        try {
          localStorage.removeItem(LOCK_UNTIL_KEY);
          localStorage.removeItem(FAILED_COUNT_KEY);
          localStorage.removeItem(FAILED_WINDOW_KEY);
        } catch {
          // ignore
        }
      } else {
        await register({
          email,
          nom_utilisateur: nomUtilisateur || null,
          mot_de_passe: motDePasse,
        });
      }
      navigate("/");
    } catch (err) {
      if (mode === "login") {
        if (err.status === 429) {
          const waitSec =
            err.retryAfter > 0 ? err.retryAfter : LOGIN_LOCKOUT_SECONDS;
          activateLockout(waitSec);
          setError(
            err.message ||
              "Trop de tentatives infructueuses (5/5). Veuillez patienter 5 minutes avant de réessayer."
          );
        } else {
          let count = 1;
          try {
            const firstTs = Number(
              localStorage.getItem(FAILED_WINDOW_KEY) || 0
            );
            const now = Date.now();
            if (
              firstTs > 0 &&
              now - firstTs < LOGIN_LOCKOUT_SECONDS * 1000
            ) {
              count =
                Number(localStorage.getItem(FAILED_COUNT_KEY) || 0) + 1;
            } else {
              localStorage.setItem(FAILED_WINDOW_KEY, String(now));
              count = 1;
            }

            if (count >= MAX_LOGIN_ATTEMPTS) {
              activateLockout(LOGIN_LOCKOUT_SECONDS);
              setError(
                "Trop de tentatives infructueuses (5/5). Veuillez patienter 5 minutes avant de réessayer."
              );
            } else {
              localStorage.setItem(FAILED_COUNT_KEY, String(count));
              setError(err.message || "Email ou mot de passe incorrect.");
            }
          } catch {
            setError(err.message || "Email ou mot de passe incorrect.");
          }
        }
      } else {
        setError(err.message || "Erreur d'authentification.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-top-actions">
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={16} />
            <span>Découvrir WebBook</span>
          </Link>
          <button
            type="button"
            className="btn-icon theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
            aria-label="Changer de thème"
          >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>

        <div className="auth-card">
          <div className="auth-brand">
            <img
              src="/iconeWebBook.png"
              alt="WebBook"
              className="brand-logo-img brand-logo-lg"
            />
            <h1>WebBook</h1>
            <p>
              {mode === "forgot"
                ? "Réinitialisation de votre mot de passe"
                : "Votre espace personnel pour centraliser, organiser et retrouver tous vos sites web et favoris."}
            </p>
          </div>

          {mode !== "forgot" ? (
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${mode === "login" ? "active" : ""}`}
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccessMsg("");
                }}
              >
                Connexion
              </button>
              <button
                type="button"
                className={`auth-tab ${mode === "register" ? "active" : ""}`}
                onClick={() => {
                  setMode("register");
                  setError("");
                  setSuccessMsg("");
                }}
              >
                Créer un compte
              </button>
            </div>
          ) : (
            <div className="auth-forgot-intro">
              <p>Entrez l'adresse mail rattachée à votre compte.</p>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          {successMsg && (
            <div className="alert alert-success">
              <CheckCircle2 size={18} style={{ marginRight: 8, flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="nom_utilisateur">Nom ou pseudo (optionnel)</label>
                <div className="input-with-icon">
                  <User size={18} />
                  <input
                    id="nom_utilisateur"
                    type="text"
                    maxLength={100}
                    placeholder="Ex: Brady"
                    value={nomUtilisateur}
                    onChange={(e) => setNomUtilisateur(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Adresse email *</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  required
                  maxLength={254}
                  placeholder="bradymouk@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="form-group">
                <label htmlFor="mot_de_passe">
                  Mot de passe * {mode === "register" && "(8 caractères min.)"}
                </label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    id="mot_de_passe"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={mode === "register" ? 8 : 1}
                    maxLength={128}
                    placeholder="••••••••"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-label="Afficher ou masquer le mot de passe"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {mode === "login" && (
                  <div className="auth-forgot-row">
                    <button
                      type="button"
                      className="auth-forgot-link"
                      onClick={() => {
                        setMode("forgot");
                        setError("");
                        setSuccessMsg("");
                      }}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === "register" && (
              <div className="privacy-consent-group">
                <label className="privacy-checkbox-label" htmlFor="privacy_consent">
                  <input
                    id="privacy_consent"
                    type="checkbox"
                    required
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  />
                  <span>
                    J'ai lu et j'accepte la{" "}
                    <button
                      type="button"
                      className="privacy-inline-link"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPrivacyModal(true);
                      }}
                    >
                      politique de confidentialité
                    </button>{" "}
                    de WebBook.
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary btn-block btn-lg ${
                isLoginLocked ? "btn-locked" : ""
              }`}
              disabled={submitting || isLoginLocked}
            >
              <span>
                {submitting
                  ? "Chargement..."
                  : mode === "login"
                    ? isLoginLocked
                      ? `Réessayer dans ${formatCountdown(lockSecondsLeft)}`
                      : "Se connecter"
                    : mode === "register"
                      ? "Créer mon espace WebBook"
                      : "Envoyer le lien de réinitialisation"}
              </span>
              {!isLoginLocked && <ArrowRight size={18} />}
            </button>

            {mode === "forgot" && (
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <button
                  type="button"
                  className="auth-back-to-login-btn"
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccessMsg("");
                  }}
                >
                  <ArrowLeft size={15} />
                  <span>Retour à la connexion</span>
                </button>
              </div>
            )}
          </form>
        </div>
    </div>

    <PrivacyModal
      isOpen={showPrivacyModal}
      onClose={() => setShowPrivacyModal(false)}
    />
  </div>
  );
}
