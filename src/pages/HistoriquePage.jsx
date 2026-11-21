import React, { useEffect, useState } from "react";
import { Trash2, ExternalLink, Clock } from "lucide-react";
import { historiqueApi, sitesApi } from "../services/api";
import SiteIcon from "../components/SiteIcon";

export default function HistoriquePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistorique = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await historiqueApi.list({ limit: 100 });
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistorique();
  }, []);

  const handleReopen = async (site) => {
    if (!site) return;
    window.open(site.url, "_blank", "noopener,noreferrer");
    try {
      await sitesApi.recordVisit(site.id_site);
      await loadHistorique();
    } catch {
      // Ignore
    }
  };

  const handleDeleteOne = async (idConsultation) => {
    try {
      await historiqueApi.deleteOne(idConsultation);
      setItems((prev) =>
        prev.filter((i) => i.id_consultation !== idConsultation)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearAll = async () => {
    if (
      !window.confirm(
        "Voulez-vous effacer tout votre historique de consultation et remettre les compteurs à zéro ?"
      )
    ) {
      return;
    }
    try {
      await historiqueApi.clearAll(true);
      setItems([]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Historique des consultations</h1>
          <p className="page-subtitle">
            Retrouvez chronologiquement tous les sites que vous avez ouverts
            depuis WebBook.
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleClearAll}
          >
            <Trash2 size={16} />
            <span>Effacer l'historique</span>
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Chargement de l'historique...</div>
      ) : items.length === 0 ? (
        <div className="empty-card">
          Votre historique de consultation est vide pour le moment.
        </div>
      ) : (
        <div className="history-list">
          {items.map((item) => (
            <div key={item.id_consultation} className="history-row">
              <div className="history-site-info">
                <SiteIcon
                  nom={item.site?.nom || "Site"}
                  url={item.site?.url}
                  iconeUrl={item.site?.icone_url}
                  size={38}
                />
                <div>
                  <strong className="history-site-name">
                    {item.site?.nom || "Site supprimé"}
                  </strong>
                  <div className="history-site-url">{item.site?.url}</div>
                </div>
              </div>

              <div className="history-meta">
                <span className="history-time">
                  <Clock size={14} />
                  {new Date(item.date_consultation).toLocaleDateString(
                    "fr-FR",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>

                <div className="site-card-secondary-actions">
                  {item.site && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleReopen(item.site)}
                    >
                      <ExternalLink size={14} />
                      <span>Ouvrir</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-icon btn-danger-icon"
                    onClick={() => handleDeleteOne(item.id_consultation)}
                    title="Retirer cette entrée"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
