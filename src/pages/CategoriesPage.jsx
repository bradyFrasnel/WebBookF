import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderPlus,
  Pencil,
  Trash2,
  Check,
  X,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { categoriesApi } from "../services/api";

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [newNom, setNewNom] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingNom, setEditingNom] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [replacementId, setReplacementId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.list();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newNom.trim()) return;
    setError("");
    setSuccess("");
    try {
      await categoriesApi.create({ nom: newNom.trim() });
      setNewNom("");
      setSuccess("Catégorie personnalisée créée avec succès.");
      await loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id_categorie);
    setEditingNom(cat.nom);
    setError("");
  };

  const handleSaveEdit = async (idCategorie) => {
    if (!editingNom.trim()) return;
    setError("");
    try {
      await categoriesApi.update(idCategorie, { nom: editingNom.trim() });
      setEditingId(null);
      setSuccess("Catégorie renommée.");
      await loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePrepareDelete = (cat) => {
    setError("");
    setSuccess("");
    if (cat.nombre_sites > 0) {
      const autres = categories.filter(
        (c) => c.id_categorie !== cat.id_categorie
      );
      setReplacementId(autres[0]?.id_categorie || "");
      setDeleteTarget(cat);
    } else {
      if (window.confirm(`Supprimer la catégorie "${cat.nom}" ?`)) {
        confirmDelete(cat.id_categorie, null);
      }
    }
  };

  const confirmDelete = async (idCategorie, nouvelleCategorieId) => {
    setError("");
    try {
      await categoriesApi.delete(idCategorie, nouvelleCategorieId);
      setDeleteTarget(null);
      setSuccess("Catégorie supprimée avec succès.");
      await loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-container">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Formulaire d'ajout de catégorie */}
      <form onSubmit={handleCreate} className="inline-add-card">
        <div className="input-with-icon flex-1">
          <FolderPlus size={18} />
          <input
            type="text"
            placeholder="Nom de la nouvelle catégorie..."
            maxLength={100}
            value={newNom}
            onChange={(e) => setNewNom(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          <FolderPlus size={18} />
          <span>Créer la catégorie</span>
        </button>
      </form>

      {/* Modale de réaffectation obligatoire (Règle de gestion 2.2) */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <AlertTriangle size={22} color="#f59e0b" />
              <h3>Réaffectation des sites requise</h3>
            </div>
            <p>
              La catégorie <strong>« {deleteTarget.nom} »</strong> contient
              encore <strong>{deleteTarget.nombre_sites} site(s)</strong>.
              Conformément aux règles de gestion, veuillez choisir la nouvelle
              catégorie dans laquelle transférer ces sites avant la suppression :
            </p>
            <div className="form-group">
              <label htmlFor="replacement">Nouvelle catégorie :</label>
              <select
                id="replacement"
                value={replacementId}
                onChange={(e) => setReplacementId(e.target.value)}
              >
                {categories
                  .filter((c) => c.id_categorie !== deleteTarget.id_categorie)
                  .map((c) => (
                    <option key={c.id_categorie} value={c.id_categorie}>
                      {c.nom} ({c.nombre_sites} site
                      {c.nombre_sites > 1 ? "s" : ""})
                    </option>
                  ))}
              </select>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeleteTarget(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() =>
                  confirmDelete(deleteTarget.id_categorie, replacementId)
                }
              >
                Transférer les sites et supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Chargement des catégories...</div>
      ) : (
        <div className="categories-grid">
          {categories.map((cat) => (
            <div key={cat.id_categorie} className="category-card">
              <div className="category-card-top">
                {editingId === cat.id_categorie ? (
                  <div className="category-edit-inline">
                    <input
                      type="text"
                      value={editingNom}
                      onChange={(e) => setEditingNom(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleSaveEdit(cat.id_categorie)}
                      title="Valider"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setEditingId(null)}
                      title="Annuler"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="category-name">{cat.nom}</h3>
                  </div>
                )}

                <span className="category-count-pill">
                  {cat.nombre_sites} site{cat.nombre_sites > 1 ? "s" : ""}
                </span>
              </div>

              <div className="category-card-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() =>
                    navigate(`/?id_categorie=${cat.id_categorie}`)
                  }
                >
                  <ExternalLink size={14} />
                  <span>Voir les sites</span>
                </button>

                <div className="site-card-secondary-actions">
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleStartEdit(cat)}
                    title="Renommer"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon btn-danger-icon"
                    onClick={() => handlePrepareDelete(cat)}
                    title="Supprimer"
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
