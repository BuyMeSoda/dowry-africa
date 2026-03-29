import { API_BASE } from "./api-url";

const STORAGE_KEY = "da_admin_secret";

export function getAdminSecret(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setAdminSecret(secret: string) {
  sessionStorage.setItem(STORAGE_KEY, secret);
}

export function clearAdminSecret() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isAdminLoggedIn(): boolean {
  return !!getAdminSecret();
}

export async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const secret = getAdminSecret();
  const url = `${API_BASE}/api/admin${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": secret ?? "",
      ...(options.headers ?? {}),
    },
  });
}

export async function adminLogin(password: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-secret": password },
    body: JSON.stringify({ password }),
  });
  if (res.ok) {
    setAdminSecret(password);
    return true;
  }
  return false;
}
