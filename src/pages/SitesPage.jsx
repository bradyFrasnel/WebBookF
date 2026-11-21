import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, PlusCircle, Filter, Star } from "lucide-react";
import { categoriesApi, sitesApi } from "../services/api";
import SiteCard from "../components/SiteCard";

export default function SitesPage({ onlyFavorites = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialCat = searchParams.get("id_categorie") || "";

  const [sites, setSites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState(initialQ);
  const [selectedCategorie, setSelectedCategorie] = useState(initialCat);
  const [onlyFavFilter, setOnlyFavFilter] = useState(onlyFavorites);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setOnlyFavFilter(onlyFavorites);
  }, [onlyFavorites]);

  useEffect(() => {
    categoriesApi
      .list()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const fetchSites = async () => {
    setLoading(true);
    setError("");
    try {
      const filters = {
        q: q.trim() || undefined,
        id_categorie: selectedCategorie || undefined,
        favori: onlyFavorites || onlyFavFilter ? true : undefined,
      };
      const data = await sitesApi.list(filters);
      setSites(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextParams = {};
      if (q.trim()) nextParams.q = q.trim();
      if (selectedCategorie) nextParams.id_categorie = selectedCategorie;
      setSearchParams(nextParams, { replace: true });
      fetchSites();
    }, 180);

    return () => clearTimeout(timer);
  }, [q, selectedCategorie, onlyFavFilter, onlyFavorites]);

  const handleToggleFavori = async (site) => {
    try {
      await sitesApi.toggleFavori(site.id_site);
      await fetchSites();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (site) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer "${site.nom}" ?`)) {
      return;
    }
    try {
      await sitesApi.delete(site.id_site);
      setSites((prev) => prev.filter((s) => s.id_site !== site.id_site));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVisited = (updatedSite) => {
    setSites((prev) =>
      prev.map((s) => (s.id_site === updatedSite.id_site ? updatedSite : s))
    );
  };

  return (
    <div className="page-container">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters-bar">
        <div className="search-input-wrapper flex-1">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom, adresse URL ou note..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="select-with-icon">
            <Filter size={16} />
            <select
              value={selectedCategorie}
              onChange={(e) => setSelectedCategorie(e.target.value)}
            >
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat.id_categorie} value={cat.id_categorie}>
                  {cat.nom} ({cat.nombre_sites})
                </option>
              ))}
            </select>
          </div>

          {!onlyFavorites && (
            <button
              type="button"
              className={`btn ${onlyFavFilter ? "btn-amber" : "btn-outline"}`}
              onClick={() => setOnlyFavFilter((v) => !v)}
            >
              <Star
                size={16}
                fill={onlyFavFilter ? "currentColor" : "none"}
              />
              <span>Favoris</span>
            </button>
          )}

          <Link to="/sites/nouveau" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Ajouter un site</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Chargement des sites...</div>
      ) : sites.length === 0 ? (
        <div className="empty-card">
          <p>Aucun site trouvé avec ces critères.</p>
          <Link to="/sites/nouveau" className="btn btn-primary btn-sm">
            <PlusCircle size={16} />
            <span>Enregistrer un site</span>
          </Link>
        </div>
      ) : (
        <div className="sites-grid">
          {sites.map((site) => (
            <SiteCard
              key={site.id_site}
              site={site}
              onToggleFavori={handleToggleFavori}
              onDelete={handleDelete}
              onVisited={handleVisited}
            />
          ))}
        </div>
      )}
    </div>
  );
}
