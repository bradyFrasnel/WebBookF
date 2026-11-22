import React from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Smartphone,
  StickyNote,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  ExternalLink,
  Star,
  Folder,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  // Si l'utilisateur est déjà connecté, il accède directement à ses sites
  if (user) {
    return <Navigate to="/sites" replace />;
  }

  return (
    <div className="landing-page">
      {/* Navigation publique */}
      <header className="landing-navbar">
        <div className="landing-container landing-nav-content">
          <div className="landing-brand">
            <img
              src="/iconeWebBook.png"
              alt="WebBook"
              className="brand-logo-img"
            />
            <span className="landing-brand-title">WebBook</span>
          </div>

          <div className="landing-nav-actions">
            <button
              type="button"
              className="btn-icon theme-toggle-btn"
              onClick={toggleTheme}
              title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
              aria-label="Changer de thème"
            >
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            <Link to="/login" className="btn btn-outline btn-sm">
              Se connecter
            </Link>

            <Link
              to="/login?mode=register"
              className="btn btn-primary btn-sm landing-nav-register-btn"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-text">
            <span className="landing-pill">Votre carnet de bord web</span>
            <h1 className="landing-title">
              Tous vos sites web favoris, réunis en un seul endroit.
            </h1>
            <p className="landing-description">
              WebBook est votre espace personnel en ligne pour centraliser vos
              liens essentiels, garder des mémos utiles et accéder à vos outils
              du quotidien en un clic, sur smartphone comme sur ordinateur.
            </p>

            <div className="landing-cta-group">
              <Link
                to="/login?mode=register"
                className="btn btn-primary btn-lg"
              >
                <span>Commencer gratuitement</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Se connecter
              </Link>
            </div>
          </div>

          {/* Maquette visuelle de carte WebBook */}
          <div className="landing-preview-wrapper">
            <div className="landing-preview-card">
              <div className="landing-card-header">
                <div className="landing-card-icon">
                  <img
                    src="/iconeWebBook.png"
                    alt="Logo"
                    style={{ width: "100%", height: "100%", borderRadius: "10px" }}
                  />
                </div>
                <div className="landing-card-info">
                  <strong>Neon Console</strong>
                  <span>console.neon.tech</span>
                </div>
                <div className="landing-card-star">
                  <Star size={18} fill="#f59e0b" color="#f59e0b" />
                </div>
              </div>

              <div className="landing-card-tag">
                <Folder size={12} />
                <span>Stockage Cloud</span>
              </div>

              <div className="landing-card-note">
                <StickyNote size={14} />
                <span>Base de données en ligne pour mes projets</span>
              </div>

              <div className="landing-card-footer">
                <div className="landing-mock-btn">
                  <ExternalLink size={14} />
                  <span>Accéder au site</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Atouts clés */}
      <section className="landing-features">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2>Conçu pour simplifier votre quotidien en ligne</h2>
            <p>Une expérience fluide, moderne et toujours à portée de main.</p>
          </div>

          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <Smartphone size={24} />
              </div>
              <h3>Disponible partout (PWA)</h3>
              <p>
                Installez WebBook comme une application native sur votre
                smartphone ou votre ordinateur. Vos favoris restent consultables
                même sans connexion Internet.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <StickyNote size={24} />
              </div>
              <h3>Notes & Mémos personnels</h3>
              <p>
                Associez des mémos à chacun de vos sites pour conserver
                précieusement un contexte d'usage, un rappel ou un détail
                important sans jamais le perdre.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <ShieldCheck size={24} />
              </div>
              <h3>Espace 100 % privé</h3>
              <p>
                Chaque utilisateur dispose de son espace entièrement cloisonné.
                Vos données et vos notes restent confidentielles et accessibles
                uniquement par vous.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section CTA Finale */}
      <section className="landing-bottom-cta">
        <div className="landing-container">
          <div className="landing-cta-box">
            <h2>Prêt à organiser votre univers web ?</h2>
            <p>
              Rejoignez WebBook dès aujourd'hui et profitez d'un accès rapide à
              vos sites favoris sur tous vos écrans.
            </p>
            <Link
              to="/login?mode=register"
              className="btn btn-primary btn-lg"
            >
              <span>Créer mon compte</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-content">
          <div className="landing-footer-brand">
            <img
              src="/iconeWebBook.png"
              alt="WebBook"
              className="brand-logo-img"
              style={{ width: "28px", height: "28px" }}
            />
            <span>WebBook — Votre espace web personnel</span>
          </div>
          <div className="landing-footer-copy">
            © {new Date().getFullYear()} WebBook. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
