import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import PwaUpdateToast from "./components/PwaUpdateToast";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import SitesPage from "./pages/SitesPage";
import SiteFormPage from "./pages/SiteFormPage";
import CategoriesPage from "./pages/CategoriesPage";
import NotesPage from "./pages/NotesPage";
import HistoriquePage from "./pages/HistoriquePage";
import ProfilPage from "./pages/ProfilPage";

function HomeRouteWrapper() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="fullscreen-loader">
        Chargement de votre espace WebBook...
      </div>
    );
  }
  if (!user) {
    return <LandingPage />;
  }
  return <Layout />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/presentation" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<HomeRouteWrapper />}>
              <Route index element={<SitesPage />} />
              <Route path="sites" element={<SitesPage />} />
              <Route path="tableau-de-bord" element={<DashboardPage />} />
              <Route path="sites/nouveau" element={<SiteFormPage />} />
              <Route path="sites/:id/modifier" element={<SiteFormPage />} />
              <Route
                path="favoris"
                element={<SitesPage onlyFavorites={true} />}
              />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="historique" element={<HistoriquePage />} />
              <Route path="profil" element={<ProfilPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <PwaUpdateToast />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
