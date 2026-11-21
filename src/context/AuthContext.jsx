import React, { createContext, useContext, useEffect, useState } from "react";
import {
  authApi,
  clearOfflineCache,
  getStoredToken,
  setStoredToken,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const profil = await authApi.me();
      setUser(profil);
      return profil;
    } catch {
      setStoredToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener("webbook:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("webbook:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (email, mot_de_passe) => {
    const res = await authApi.login({ email, mot_de_passe });
    setStoredToken(res.access_token);
    return await fetchCurrentUser();
  };

  const register = async ({ email, nom_utilisateur, mot_de_passe }) => {
    await authApi.register({ email, nom_utilisateur, mot_de_passe });
    return await login(email, mot_de_passe);
  };

  const logout = () => {
    setStoredToken(null);
    clearOfflineCache();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return ctx;
}
