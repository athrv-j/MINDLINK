/* ═══════════════════════════════════════════════════════════════
   LOCAL STORAGE ABSTRACTION
   Safe read/write with error handling. Never throws.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Read and parse JSON from localStorage.
 * Returns fallback on any error (missing key, corrupted data, etc.).
 */
export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[MindLink] Failed to read localStorage key "${key}":`, err);
    return fallback;
  }
}

/**
 * Serialize and write JSON to localStorage.
 * Silently catches quota/write errors.
 */
export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[MindLink] Failed to write localStorage key "${key}":`, err);
  }
}

/**
 * Remove a key from localStorage.
 */
export function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[MindLink] Failed to remove localStorage key "${key}":`, err);
  }
}
