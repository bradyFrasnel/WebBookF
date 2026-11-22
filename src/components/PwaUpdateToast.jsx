import React, { useEffect, useState } from "react";
import { Sparkles, RefreshCw, X } from "lucide-react";

export default function PwaUpdateToast() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    const handleUpdateReady = (event) => {
      const reg = event?.detail?.registration;
      if (reg && reg.waiting) {
        setWaitingWorker(reg.waiting);
      }
      setUpdateAvailable(true);
    };

    window.addEventListener("webbook:pwa-update-ready", handleUpdateReady);

    // Vérifie si un worker est déjà en attente au chargement
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          setWaitingWorker(reg.waiting);
          setUpdateAvailable(true);
        }
      });
    }

    return () => {
      window.removeEventListener("webbook:pwa-update-ready", handleUpdateReady);
    };
  }, []);

  if (!updateAvailable) return null;

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };

  return (
    <aside
      className="pwa-update-toast"
      role="status"
      aria-live="polite"
      aria-label="Mise à jour de l'application disponible"
    >
      <div className="pwa-update-content">
        <Sparkles size={20} className="pwa-update-icon" />
        <div className="pwa-update-text">
          <strong>Mise à jour disponible</strong>
          <span>Une nouvelle version de WebBook est prête.</span>
        </div>
      </div>
      <div className="pwa-update-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleUpdate}
        >
          <RefreshCw size={13} style={{ marginRight: 6 }} />
          Mettre à jour
        </button>
        <button
          type="button"
          className="pwa-update-close"
          onClick={() => setUpdateAvailable(false)}
          title="Fermer"
          aria-label="Fermer la notification"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}
