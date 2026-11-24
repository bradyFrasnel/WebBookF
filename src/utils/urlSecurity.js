/**
 * Vérifie qu'une URL utilise strictement le protocole http: ou https:
 * afin d'empêcher toute exécution XSS via javascript:, data:, vbscript:, etc.
 */
export function isSafeHttpUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || /[\s<>"'\\\x00-\x1f\x7f]/.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    if (parsed.username || parsed.password) {
      return false;
    }
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function openSafeExternalUrl(rawUrl) {
  if (!isSafeHttpUrl(rawUrl)) return false;
  window.open(rawUrl.trim(), "_blank", "noopener,noreferrer");
  return true;
}
