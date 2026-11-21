import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Star } from "lucide-react";
import { categoriesApi, sitesApi } from "../services/api";
import SiteIcon from "../components/SiteIcon";

export default function SiteFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [nom, setNom] = useState("");
  const [url, setUrl] = useState("");
  const [idCategorie, setIdCategorie] = useState("");
  const [iconeUrl, setIconeUrl] = useState("");
  const [favori, setFavori] = useState(false);
  const [notePersonnelle, setNotePersonnelle] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError("");
      try {
        const cats = await categoriesApi.list();
        setCategories(cats);

        if (isEdit) {
          const site = await sitesApi.get(id);
          setNom(site.nom);
          setUrl(site.url);
          setIdCategorie(site.id_categorie);
          setIconeUrl(site.icone_url || "");
          setFavori(site.favori);
          setNotePersonnelle(site.note_personnelle || "");
        } else if (cats.length > 0) {
          setIdCategorie(cats[0].id_categorie);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      nom,
      url,
      id_categorie: idCategorie,
      icone_url: iconeUrl.trim() || null,
      favori,
      note_personnelle: notePersonnelle.trim() || null,
    };

    try {
      if (isEdit) {
        await sitesApi.update(id, payload);
      } else {
        await sitesApi.create(payload);
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Chargement du formulaire...</div>;
  }

  return (
    <div className="page-container narrow-container">
      <div className="page-header">
        <div>
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            <span>Retour aux sites</span>
          </Link>
          <h1>{isEdit ? "Modifier le site" : "Ajouter un nouveau site"}</h1>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="card-form">
        <div className="site-preview-banner">
          <SiteIcon
            nom={nom || "Aperçu"}
            url={url}
            iconeUrl={iconeUrl.trim() || null}
            size={48}
          />
          <div>
            <strong>{nom || "Nom de la plateforme"}</strong>
            <div className="muted-text">{url || "https://exemple.com"}</div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="nom">1. Nom du site *</label>
          <input
            id="nom"
            type="text"
            required
            maxLength={150}
            placeholder="Ex: GitHub, Notion, ChatGPT..."
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="url">2. Adresse URL du site *</label>
          <input
            id="url"
            type="text"
            required
            placeholder="Ex: https://github.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="categorie">3. Catégorie *</label>
          <select
            id="categorie"
            required
            value={idCategorie}
            onChange={(e) => setIdCategorie(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat.id_categorie} value={cat.id_categorie}>
                {cat.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="note_personnelle">
            Note personnelle rapide (optionnel)
          </label>
          <textarea
            id="note_personnelle"
            rows={3}
            maxLength={5000}
            placeholder="Ajoutez un mémo, l'utilité de ce site, un rappel..."
            value={notePersonnelle}
            onChange={(e) => setNotePersonnelle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="icone_url">
            URL d'icône personnalisée (optionnel — laisser vide pour le favicon
            automatique)
          </label>
          <input
            id="icone_url"
            type="text"
            placeholder="https://exemple.com/logo.png"
            value={iconeUrl}
            onChange={(e) => setIconeUrl(e.target.value)}
          />
        </div>

        <div className="form-group-checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={favori}
              onChange={(e) => setFavori(e.target.checked)}
            />
            <Star
              size={17}
              fill={favori ? "#f59e0b" : "none"}
              color={favori ? "#f59e0b" : "currentColor"}
            />
            <span>Marquer ce site comme favori</span>
          </label>
        </div>

        <div className="form-actions">
          <Link to="/" className="btn btn-outline">
            Annuler
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={18} />
            <span>
              {saving
                ? "Enregistrement..."
                : isEdit
                  ? "Enregistrer les modifications"
                  : "Ajouter le site"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
