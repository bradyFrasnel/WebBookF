import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Star,
  Pencil,
  Trash2,
  Eye,
  StickyNote,
  Folder,
  Link2,
  Check,
} from "lucide-react";
import SiteIcon from "./SiteIcon";
import { sitesApi } from "../services/api";
import { openSafeExternalUrl } from "../utils/urlSecurity";

export default function SiteCard({
  site,
  onToggleFavori,
  onDelete,
  onVisited,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(site.url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = site.url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleOpenSite = async () => {
    if (!openSafeExternalUrl(site.url)) return;
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
            <div className="site-card-domain-row">
              <span className="site-card-domain" title={site.url}>
                {domaine}
              </span>
              <button
                type="button"
                className={`btn-copy-inline ${copied ? "copied" : ""}`}
                onClick={handleCopyLink}
                title={copied ? "Lien copié dans le presse-papiers !" : "Copier le lien"}
                aria-label="Copier le lien"
              >
                {copied ? <Check size={14} /> : <Link2 size={14} />}
              </button>
            </div>
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
