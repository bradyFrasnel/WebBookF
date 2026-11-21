import React, { useEffect, useState } from "react";
import {
  PlusCircle,
  Pin,
  Pencil,
  Trash2,
  Search,
  Globe,
  X,
  Save,
} from "lucide-react";
import { notesApi, sitesApi } from "../services/api";

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [sites, setSites] = useState([]);
  const [q, setQ] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // État du formulaire (création ou modification)
  const [showForm, setShowForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [idSite, setIdSite] = useState("");
  const [epingle, setEpingle] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sitesApi
      .list()
      .then(setSites)
      .catch(() => {});
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await notesApi.list({
        q: q.trim() || undefined,
        id_site: filterSite || undefined,
      });
      setNotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchNotes, 180);
    return () => clearTimeout(timer);
  }, [q, filterSite]);

  const openCreateForm = () => {
    setEditingNoteId(null);
    setTitre("");
    setContenu("");
    setIdSite(filterSite || "");
    setEpingle(false);
    setShowForm(true);
  };

  const openEditForm = (note) => {
    setEditingNoteId(note.id_note);
    setTitre(note.titre);
    setContenu(note.contenu);
    setIdSite(note.id_site || "");
    setEpingle(note.epingle);
    setShowForm(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      titre,
      contenu,
      id_site: idSite || null,
      epingle,
    };

    try {
      if (editingNoteId) {
        await notesApi.update(editingNoteId, payload);
      } else {
        await notesApi.create(payload);
      }
      setShowForm(false);
      await fetchNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEpingle = async (note) => {
    try {
      await notesApi.toggleEpingle(note.id_note);
      await fetchNotes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (note) => {
    if (!window.confirm(`Supprimer la note "${note.titre}" ?`)) return;
    try {
      await notesApi.delete(note.id_note);
      setNotes((prev) => prev.filter((n) => n.id_note !== note.id_note));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Notes personnelles</h1>
          <p className="page-subtitle">
            Prenez des notes libres ou rattachées à vos sites enregistrés.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateForm}
        >
          <PlusCircle size={18} />
          <span>Nouvelle note</span>
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form onSubmit={handleSaveNote} className="card-form mb-20">
          <div className="section-header">
            <h3>
              {editingNoteId ? "Modifier la note" : "Créer une note personnelle"}
            </h3>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowForm(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="note_titre">Titre *</label>
            <input
              id="note_titre"
              type="text"
              required
              maxLength={200}
              placeholder="Ex: Astuces déploiement Cloud, Ressources React..."
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="note_site">Site associé (optionnel)</label>
            <select
              id="note_site"
              value={idSite}
              onChange={(e) => setIdSite(e.target.value)}
            >
              <option value="">— Note indépendante (aucun site) —</option>
              {sites.map((s) => (
                <option key={s.id_site} value={s.id_site}>
                  {s.nom} ({s.url})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="note_contenu">Contenu *</label>
            <textarea
              id="note_contenu"
              rows={5}
              required
              placeholder="Rédigez votre note ici..."
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
            />
          </div>

          <div className="form-group-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={epingle}
                onChange={(e) => setEpingle(e.target.checked)}
              />
              <Pin size={16} />
              <span>Épingler cette note en haut de la liste</span>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowForm(false)}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              <span>{saving ? "Enregistrement..." : "Enregistrer la note"}</span>
            </button>
          </div>
        </form>
      )}

      <div className="filters-bar">
        <div className="search-input-wrapper flex-1">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher dans le titre ou le contenu des notes..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="select-with-icon">
          <Globe size={16} />
          <select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
          >
            <option value="">Tous les sites & notes libres</option>
            {sites.map((s) => (
              <option key={s.id_site} value={s.id_site}>
                {s.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Chargement des notes...</div>
      ) : notes.length === 0 ? (
        <div className="empty-card">
          <p>Aucune note personnelle trouvée.</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openCreateForm}
          >
            <PlusCircle size={16} />
            <span>Créer ma première note</span>
          </button>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <div
              key={note.id_note}
              className={`note-card ${note.epingle ? "pinned" : ""}`}
            >
              <div className="note-card-header">
                <h3>{note.titre}</h3>
                <button
                  type="button"
                  className={`btn-icon ${note.epingle ? "active-pin" : ""}`}
                  onClick={() => handleToggleEpingle(note)}
                  title={note.epingle ? "Désépingler" : "Épingler"}
                >
                  <Pin size={16} />
                </button>
              </div>

              {note.site && (
                <a
                  href={note.site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="note-site-link"
                >
                  <Globe size={13} />
                  <span>{note.site.nom}</span>
                </a>
              )}

              <p className="note-content">{note.contenu}</p>

              <div className="note-card-footer">
                <span className="note-date">
                  Modifiée le{" "}
                  {new Date(note.date_modification).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div className="site-card-secondary-actions">
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => openEditForm(note)}
                    title="Modifier"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon btn-danger-icon"
                    onClick={() => handleDelete(note)}
                    title="Supprimer"
                  >
                    <Trash2 size={15} />
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
