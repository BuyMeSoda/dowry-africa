/**
 * Resolved API base URL.
 *
 * Priority:
 *   1. VITE_API_URL env var baked in at build time — set this in Railway / any deployment.
 *   2. Empty string in dev so the Vite dev-server proxy handles /api/* normally.
 *
 * In production, VITE_API_URL MUST be set to your API server's public URL, e.g.:
 *   https://api.yourdomain.com
 */
export const API_BASE: string = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
