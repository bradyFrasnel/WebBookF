import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Globe,
  Star,
  FolderKanban,
  StickyNote,
  History,
  User,
  LogOut,
  Menu,
  X,
  Download,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", icon: Globe, label: "Tous les sites", end: true },
    { to: "/tableau-de-bord", icon: LayoutDashboard, label: "Tableau de bord" },
    { to: "/favoris", icon: Star, label: "Favoris" },
    { to: "/categories", icon: FolderKanban, label: "Catégories" },
    { to: "/notes", icon: StickyNote, label: "Notes personnelles" },
    { to: "/historique", icon: History, label: "Historique" },
    { to: "/profil", icon: User, label: "Mon profil" },
  ];

  const displayName =
    user?.nom_utilisateur || user?.email?.split("@")[0] || "Utilisateur";

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <img
            src="/iconeWebBook.png"
            alt="WebBook"
            className="brand-logo-img"
          />
          <div>
            <span className="brand-title">WebBook</span>
            <span className="brand-subtitle">Votre espace à vous !</span>
          </div>
          <button
            type="button"
            className="btn-icon mobile-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {installPrompt && (
            <button
              type="button"
              className="btn btn-outline btn-block install-pwa-btn"
              onClick={handleInstallPwa}
            >
              <Download size={16} />
              <span>Installer l'application</span>
            </button>
          )}

          <div className="user-mini-card">
            <div className="user-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{displayName}</span>
              <span className="user-email">{user?.email}</span>
            </div>
            <button
              type="button"
              className="btn-icon btn-danger-icon"
              onClick={handleLogout}
              title="Se déconnecter"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="btn-icon mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} />
            </button>

            <div className="topbar-title-block">
              <h1>WebBook</h1>
              <p className="page-subtitle">
                Votre espace personnel pour centraliser, organiser et retrouver
                tous vos sites WebBook.
              </p>
            </div>
          </div>

          <div className="topbar-status">
            {isOffline && (
              <span className="offline-pill">
                <WifiOff size={14} />
                hors-ligne
              </span>
            )}
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
