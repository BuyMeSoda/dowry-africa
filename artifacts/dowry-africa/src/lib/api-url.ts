/**
 * Resolved API base URL.
 *
 * Priority:
 *   1. VITE_API_URL env var baked in at build time (set this on Railway for a clean deploy)
 *   2. Hardcoded production URL — ensures production always points at the real API
 *      even when the env var is missing at build time.
 *   3. Empty string in local dev so the Vite dev-server proxy handles /api/* normally.
 */
export const API_BASE: string = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? ""
    : "https://workspaceapi-server-production-bb0e.up.railway.app")
).replace(/\/+$/, "");
