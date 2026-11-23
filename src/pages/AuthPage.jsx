import React, { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Sun, Moon, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import PrivacyModal from "../components/PrivacyModal";

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
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/sites" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
      } else {
        await register({
          email,
          nom_utilisateur: nomUtilisateur || null,
          mot_de_passe: motDePasse,
        });
      }
      navigate("/");
    } catch (err) {
      setError(err.message || "Erreur d'authentification.");
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
            Votre espace personnel pour centraliser, organiser et retrouver tous
            vos sites web et favoris.
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
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
            }}
          >
            Créer un compte
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <div className="form-group">
              <label htmlFor="nom_utilisateur">Nom ou pseudo (optionnel)</label>
              <div className="input-with-icon">
                <User size={18} />
                <input
                  id="nom_utilisateur"
                  type="text"
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
                placeholder="bradymouk@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="mot_de_passe">
              Mot de passe * {mode === "register" && "(8 caractères min.)"}
            </label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                id="mot_de_passe"
                type="password"
                required
                minLength={mode === "register" ? 8 : 1}
                placeholder="••••••••"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
              />
            </div>
          </div>

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
            className="btn btn-primary btn-block btn-lg"
            disabled={submitting}
          >
            <span>
              {submitting
                ? "Chargement..."
                : mode === "login"
                  ? "Se connecter"
                  : "Créer mon espace WebBook"}
            </span>
            <ArrowRight size={18} />
          </button>
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
