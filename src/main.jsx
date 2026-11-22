import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Vérification périodique des mises à jour toutes les 30 minutes
        setInterval(() => {
          registration.update().catch(() => {});
        }, 1000 * 60 * 30);

        // Vérification au retour sur l'application (déverrouillage mobile / réouverture onglet)
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        });

        // Détection de l'arrivée d'une nouvelle version
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              window.dispatchEvent(
                new CustomEvent("webbook:pwa-update-ready", {
                  detail: { registration },
                })
              );
            }
          });
        });
      })
      .catch(() => {});

    // Rechargement immédiat et propre après activation du nouveau worker
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
