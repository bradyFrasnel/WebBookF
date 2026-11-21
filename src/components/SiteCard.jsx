import React from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Star,
  Pencil,
  Trash2,
  Eye,
  StickyNote,
  Folder,
} from "lucide-react";
import SiteIcon from "./SiteIcon";
import { sitesApi } from "../services/api";

export default function SiteCard({
  site,
  onToggleFavori,
  onDelete,
  onVisited,
}) {
  const handleOpenSite = async () => {
    if (!/^https?:\/\//i.test(site.url)) return;
    window.open(site.url, "_blank", "noopener,noreferrer");
    try {
      const updated = await sitesApi.recordVisit(site.id_site);
      if (onVisited) onVisited(updated);
    } catch {
      // Ignore en mode hors-ligne
    }
  };

  let domaine = site.url;
  try {
    domaine = new URL(site.url).hostname.replace(/^www\./, "");
  } catch {
    domaine = site.url;
  }

  return (
    <div className="site-card">
      <div className="site-card-header">
        <div className="site-card-identity">
          <SiteIcon
            nom={site.nom}
            url={site.url}
            iconeUrl={site.icone_url}
            size={44}
          />
          <div className="site-card-titles">
            <h3 className="site-card-name" title={site.nom}>
              {site.nom}
            </h3>
            <span className="site-card-domain" title={site.url}>
              {domaine}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`btn-icon btn-star ${site.favori ? "active" : ""}`}
          onClick={() => onToggleFavori && onToggleFavori(site)}
          title={site.favori ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Star size={18} fill={site.favori ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="site-card-badges">
        {site.categorie && (
          <span className="badge badge-category">
            <Folder size={13} />
            {site.categorie.nom}
          </span>
        )}
        <span className="badge badge-visits" title="Nombre de consultations">
          <Eye size={13} />
          {site.nombre_consultations || 0} visite
          {(site.nombre_consultations || 0) > 1 ? "s" : ""}
        </span>
      </div>

      {site.note_personnelle && (
        <div className="site-card-note" title={site.note_personnelle}>
          <StickyNote size={14} />
          <span>{site.note_personnelle}</span>
        </div>
      )}

      <div className="site-card-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm site-open-btn"
          onClick={handleOpenSite}
        >
          <ExternalLink size={15} />
          <span>Accéder au site</span>
        </button>

        <div className="site-card-secondary-actions">
          <Link
            to={`/sites/${site.id_site}/modifier`}
            className="btn-icon"
            title="Modifier ce site"
          >
            <Pencil size={16} />
          </Link>
          {onDelete && (
            <button
              type="button"
              className="btn-icon btn-danger-icon"
              onClick={() => onDelete(site)}
              title="Supprimer ce site"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
