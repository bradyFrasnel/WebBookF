import React, { useEffect } from "react";
import { ShieldCheck, X, Lock, Database, Trash2, EyeOff } from "lucide-react";

export default function PrivacyModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay privacy-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div
        className="modal-card privacy-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="privacy-modal-header">
          <div className="privacy-header-identity">
            <div className="privacy-icon-badge">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 id="privacy-modal-title">Politique de Confidentialité</h2>
              <span className="privacy-subtitle">
                Protection de vos données & Respect de votre vie privée
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="privacy-modal-body">
          <section className="privacy-section">
            <div className="privacy-section-title">
              <EyeOff size={18} className="privacy-section-icon" />
              <h3>1. Notre engagement</h3>
            </div>
            <p>
              WebBook est un outil personnel conçu avec une philosophie simple :
              <strong> votre vie privée n'est pas à vendre</strong>. Nous ne
              faisons aucun ciblage publicitaire, aucune revente de données et
              aucun traçage intrusif de vos activités sur le web.
            </p>
          </section>

          <section className="privacy-section">
            <div className="privacy-section-title">
              <Database size={18} className="privacy-section-icon" />
              <h3>2. Les données collectées</h3>
            </div>
            <p>
              Nous collectons uniquement les informations strictement nécessaires
              au fonctionnement de votre carnet de liens :
            </p>
            <ul>
              <li>
                <strong>Compte utilisateur :</strong> votre adresse email et votre
                nom d'utilisateur (facultatif).
              </li>
              <li>
                <strong>Données enregistrées :</strong> les adresses de sites (URLs),
                titres, catégories choisies et vos notes personnelles.
              </li>
              <li>
                <strong>Statistiques d'usage privées :</strong> le compteur de
                consultations par site pour votre propre usage.
              </li>
            </ul>
          </section>

          <section className="privacy-section">
            <div className="privacy-section-title">
              <Lock size={18} className="privacy-section-icon" />
              <h3>3. Sécurité & Stockage</h3>
            </div>
            <p>
              Vos mots de passe sont hachés de manière irréversible avant tout
              enregistrement en base de données. L'ensemble des communications
              entre votre appareil et nos serveurs s'effectue via des canaux
              sécurisés et chiffrés (HTTPS / TLS).
            </p>
          </section>

          <section className="privacy-section">
            <div className="privacy-section-title">
              <Trash2 size={18} className="privacy-section-icon" />
              <h3>4. Contrôle total & Suppression</h3>
            </div>
            <p>
              Vous conservez la propriété intégrale de vos données. À tout moment,
              depuis l'onglet <strong>« Mon profil »</strong>, vous pouvez modifier
              vos informations ou <strong>supprimer définitivement votre compte</strong>.
              Cette action efface immédiatement et irréversiblement tous vos sites,
              notes et historiques sans conservation d'archive.
            </p>
          </section>
        </div>

        <div className="privacy-modal-footer">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={onClose}
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
