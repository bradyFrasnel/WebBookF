import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BookMarked, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [nomUtilisateur, setNomUtilisateur] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
                placeholder="vous@exemple.com"
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
  );
}
