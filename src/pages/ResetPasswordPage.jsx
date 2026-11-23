import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { authApi } from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [nouveauMdp, setNouveauMdp] = useState("");
  const [confirmerMdp, setConfirmerMdp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Le lien de réinitialisation est incomplet ou invalide (token manquant).");
      return;
    }

    if (nouveauMdp.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (nouveauMdp !== confirmerMdp) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.resetPassword({
        token,
        nouveau_mot_de_passe: nouveauMdp,
      });
      setSuccess(
        res?.message ||
          "Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter."
      );
    } catch (err) {
      setError(err.message || "Erreur lors de la réinitialisation du mot de passe.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-top-actions">
          <Link to="/login" className="auth-back-link">
            <ArrowLeft size={16} />
            <span>Retour à la connexion</span>
          </Link>
        </div>

        <div className="auth-card">
          <div className="auth-brand">
            <img
              src="/iconeWebBook.png"
              alt="WebBook"
              className="brand-logo-img brand-logo-lg"
            />
            <h1>WebBook</h1>
            <p>Définir un nouveau mot de passe</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} style={{ marginRight: 8, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="reset-success-box">
              <div className="reset-success-icon">
                <CheckCircle2 size={44} color="var(--success)" />
              </div>
              <h3>Mot de passe modifié !</h3>
              <p>{success}</p>
              <Link to="/login" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 18 }}>
                <span>Se connecter</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nouveau_mot_de_passe">
                  Nouveau mot de passe * (8 caractères min.)
                </label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    id="nouveau_mot_de_passe"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={nouveauMdp}
                    onChange={(e) => setNouveauMdp(e.target.value)}
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
              </div>

              <div className="form-group">
                <label htmlFor="confirmer_mot_de_passe">
                  Confirmer le mot de passe *
                </label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    id="confirmer_mot_de_passe"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={confirmerMdp}
                    onChange={(e) => setConfirmerMdp(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={submitting}
              >
                <span>{submitting ? "Mise à jour en cours..." : "Enregistrer mon nouveau mot de passe"}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
