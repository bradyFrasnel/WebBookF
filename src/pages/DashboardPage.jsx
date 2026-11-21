import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Globe,
  FolderKanban,
  Star,
  StickyNote,
  Eye,
  Search,
  PlusCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { sitesApi, statistiquesApi } from "../services/api";
import SiteCard from "../components/SiteCard";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recents, setRecents] = useState([]);
  const [favoris, setFavoris] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsData, recentsData, favorisData] = await Promise.all([
        statistiquesApi.get(),
        sitesApi.listRecents(4),
        sitesApi.listFavoris(),
      ]);
      setStats(statsData);
      setRecents(recentsData);
      setFavoris(favorisData.slice(0, 4));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await sitesApi.list({ q });
        setSearchResults(res);
      } catch {
        setSearchResults([]);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleToggleFavori = async (site) => {
    try {
      await sitesApi.toggleFavori(site.id_site);
      await loadDashboard();
      if (searchQuery.trim()) {
        const res = await sitesApi.list({ q: searchQuery.trim() });
        setSearchResults(res);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteSite = async (site) => {
    if (!window.confirm(`Supprimer le site "${site.nom}" ?`)) return;
    try {
      await sitesApi.delete(site.id_site);
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && !stats) {
    return <div className="loading-state">Chargement du tableau de bord...</div>;
  }

  return (
    <div className="page-container">
      {error && <div className="alert alert-error">{error}</div>}

      {/* Barre de recherche rapide depuis le tableau de bord (Section 2.3) */}
      <div className="dashboard-search-box">
        <div className="search-input-wrapper">
          <Search size={20} />
          <input
            type="text"
            placeholder="Rechercher rapidement un site par son nom, son URL ou sa note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setSearchQuery("")}
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {searchResults !== null && (
        <section className="dashboard-section">
          <div className="section-header">
            <h2>
              Résultats de recherche ({searchResults.length}) pour «{" "}
              {searchQuery} »
            </h2>
            <Link
              to={`/sites?q=${encodeURIComponent(searchQuery)}`}
              className="section-link"
            >
              <span>Voir dans Tous les sites</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          {searchResults.length === 0 ? (
            <div className="empty-card">
              Aucun site ne correspond à votre recherche.
            </div>
          ) : (
            <div className="sites-grid">
              {searchResults.map((site) => (
                <SiteCard
                  key={site.id_site}
                  site={site}
                  onToggleFavori={handleToggleFavori}
                  onDelete={handleDeleteSite}
                  onVisited={loadDashboard}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Cartes de statistiques (Section 2.6) */}
      {stats && (
        <div className="stats-grid">
          <div
            className="stat-card clickable"
            onClick={() => navigate("/sites")}
          >
            <div className="stat-icon stat-indigo">
              <Globe size={22} />
            </div>
            <div>
              <span className="stat-value">{stats.total_sites}</span>
              <span className="stat-label">Sites enregistrés</span>
            </div>
          </div>

          <div
            className="stat-card clickable"
            onClick={() => navigate("/categories")}
          >
            <div className="stat-icon stat-purple">
              <FolderKanban size={22} />
            </div>
            <div>
              <span className="stat-value">{stats.total_categories}</span>
              <span className="stat-label">Catégories</span>
            </div>
          </div>

          <div
            className="stat-card clickable"
            onClick={() => navigate("/favoris")}
          >
            <div className="stat-icon stat-amber">
              <Star size={22} />
            </div>
            <div>
              <span className="stat-value">{stats.total_favoris}</span>
              <span className="stat-label">Sites favoris</span>
            </div>
          </div>

          <div
            className="stat-card clickable"
            onClick={() => navigate("/notes")}
          >
            <div className="stat-icon stat-emerald">
              <StickyNote size={22} />
            </div>
            <div>
              <span className="stat-value">{stats.total_notes || 0}</span>
              <span className="stat-label">Notes personnelles</span>
            </div>
          </div>

          <div
            className="stat-card clickable"
            onClick={() => navigate("/historique")}
          >
            <div className="stat-icon stat-sky">
              <Eye size={22} />
            </div>
            <div>
              <span className="stat-value">
                {stats.total_consultations || 0}
              </span>
              <span className="stat-label">Consultations</span>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-columns">
        {/* Répartition des sites par catégorie (Section 2.6) */}
        <section className="dashboard-panel">
          <div className="section-header">
            <h2>Répartition par catégorie</h2>
            <Link to="/categories" className="section-link">
              <span>Gérer</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {stats?.repartition_par_categorie?.length > 0 ? (
            <div className="category-distribution-list">
              {stats.repartition_par_categorie.map((cat) => (
                <div
                  key={cat.id_categorie}
                  className="distribution-row"
                  onClick={() =>
                    navigate(`/?id_categorie=${cat.id_categorie}`)
                  }
                >
                  <div className="distribution-info">
                    <span className="distribution-name">{cat.nom}</span>
                    <span className="distribution-count">
                      {cat.nombre_sites} site{cat.nombre_sites > 1 ? "s" : ""} (
                      {cat.pourcentage}%)
                    </span>
                  </div>
                  <div className="distribution-bar-track">
                    <div
                      className="distribution-bar-fill"
                      style={{ width: `${Math.max(cat.pourcentage, cat.nombre_sites > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">Aucune catégorie disponible.</p>
          )}
        </section>

        {/* Sites récemment consultés */}
        <section className="dashboard-panel">
          <div className="section-header">
            <h2>
              <Clock size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Récemment consultés
            </h2>
            <Link to="/historique" className="section-link">
              <span>Historique complet</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {recents.length === 0 ? (
            <div className="empty-card">
              Cliquez sur « Accéder au site » depuis une carte pour alimenter
              automatiquement votre historique de consultation.
            </div>
          ) : (
            <div className="sites-grid-compact">
              {recents.map((site) => (
                <SiteCard
                  key={site.id_site}
                  site={site}
                  onToggleFavori={handleToggleFavori}
                  onVisited={loadDashboard}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Section Favoris rapides */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Accès rapide aux Favoris</h2>
          <Link to="/favoris" className="section-link">
            <span>Tous les favoris</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {favoris.length === 0 ? (
          <div className="empty-card">
            Vous n'avez pas encore de site favori !!
          </div>
        ) : (
          <div className="sites-grid">
            {favoris.map((site) => (
              <SiteCard
                key={site.id_site}
                site={site}
                onToggleFavori={handleToggleFavori}
                onDelete={handleDeleteSite}
                onVisited={loadDashboard}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
