const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const TOKEN_KEY = "webbook_access_token";
const OFFLINE_CACHE_PREFIX = "webbook_offline_cache:";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearOfflineCache() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(OFFLINE_CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

async function request(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const token = getStoredToken();
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    // Fallback hors-ligne PWA : lecture des données préalablement synchronisées
    if (method === "GET") {
      const cached = localStorage.getItem(`${OFFLINE_CACHE_PREFIX}${endpoint}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
    }
    throw new Error(
      "Impossible de joindre le serveur. Vérifiez votre connexion."
    );
  }

  if (response.status === 204) {
    return null;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    // Fallback sur le cache local PWA si la base de données cloud (Neon) est temporairement indisponible (502/503/504)
    if (
      method === "GET" &&
      (response.status === 502 ||
        response.status === 503 ||
        response.status === 504)
    ) {
      const cached = localStorage.getItem(`${OFFLINE_CACHE_PREFIX}${endpoint}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
    }

    // Point 4 : Déconnexion automatique si le token JWT a expiré (401)
    if (response.status === 401 && endpoint !== "/api/auth/login") {
      setStoredToken(null);
      clearOfflineCache();
      window.dispatchEvent(new Event("webbook:unauthorized"));
    }

    let message = "Une erreur est survenue lors de la requête.";
    if (data?.detail) {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        message = data.detail.map((err) => err.msg).join(" | ");
      }
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  // Sauvegarde automatique en cache local pour la consultation hors-ligne PWA
  if (method === "GET" && data !== null) {
    try {
      localStorage.setItem(
        `${OFFLINE_CACHE_PREFIX}${endpoint}`,
        JSON.stringify(data)
      );
    } catch {
      // Ignore si quota localStorage atteint
    }
  }

  return data;
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export const authApi = {
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => request("/api/auth/me"),
  forgotPassword: (email) =>
    request("/api/auth/mot-de-passe-oublie", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (payload) =>
    request("/api/auth/reinitialiser-mot-de-passe", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const profilApi = {
  get: () => request("/api/utilisateurs/me"),
  update: (payload) =>
    request("/api/utilisateurs/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  changePassword: (payload) =>
    request("/api/utilisateurs/me/mot-de-passe", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteAccount: () =>
    request("/api/utilisateurs/me", {
      method: "DELETE",
    }),
};

export const categoriesApi = {
  list: () => request("/api/categories"),
  get: (id) => request(`/api/categories/${id}`),
  listSites: (id) => request(`/api/categories/${id}/sites`),
  create: (payload) =>
    request("/api/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/api/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  delete: (id, nouvelleCategorieId = null) =>
    request(
      `/api/categories/${id}${buildQuery({
        nouvelle_categorie_id: nouvelleCategorieId,
      })}`,
      {
        method: "DELETE",
      }
    ),
};

export const sitesApi = {
  list: (filters = {}) => request(`/api/sites${buildQuery(filters)}`),
  listFavoris: (q = "") => request(`/api/sites/favoris${buildQuery({ q })}`),
  listRecents: (limit = 8) =>
    request(`/api/sites/recents${buildQuery({ limit })}`),
  get: (id) => request(`/api/sites/${id}`),
  listNotes: (id) => request(`/api/sites/${id}/notes`),
  create: (payload) =>
    request("/api/sites", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/api/sites/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  toggleFavori: (id) =>
    request(`/api/sites/${id}/favori`, {
      method: "PATCH",
    }),
  recordVisit: (id) =>
    request(`/api/sites/${id}/consulter`, {
      method: "POST",
    }),
  delete: (id) =>
    request(`/api/sites/${id}`, {
      method: "DELETE",
    }),
};

export const notesApi = {
  list: (filters = {}) => request(`/api/notes${buildQuery(filters)}`),
  get: (id) => request(`/api/notes/${id}`),
  create: (payload) =>
    request("/api/notes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/api/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  toggleEpingle: (id) =>
    request(`/api/notes/${id}/epingler`, {
      method: "PATCH",
    }),
  delete: (id) =>
    request(`/api/notes/${id}`, {
      method: "DELETE",
    }),
};

export const historiqueApi = {
  list: (filters = {}) => request(`/api/historique${buildQuery(filters)}`),
  deleteOne: (id) =>
    request(`/api/historique/${id}`, {
      method: "DELETE",
    }),
  clearAll: (reinitialiserCompteurs = true) =>
    request(
      `/api/historique${buildQuery({
        reinitialiser_compteurs: reinitialiserCompteurs,
      })}`,
      {
        method: "DELETE",
      }
    ),
};

export const statistiquesApi = {
  get: () => request("/api/statistiques"),
};
