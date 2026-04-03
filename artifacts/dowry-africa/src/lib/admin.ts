import { API_BASE } from "./api-url";

const TOKEN_KEY = "da_admin_token";
const USER_KEY  = "da_admin_user";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive?: boolean;
  lastLogin?: string | null;
  createdAt?: string;
}

export function getAdminToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getAdminUser(): AdminUser | null {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AdminUser; } catch { return null; }
}

export function setAdminSession(token: string, user: AdminUser): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function clearAdminSecret(): void {
  clearAdminSession();
}

export function isAdminLoggedIn(): boolean {
  return !!getAdminToken();
}

export async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const url = `${API_BASE}/api/admin${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

export async function adminAuthFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const url = `${API_BASE}/api/admin-auth${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

export async function adminLogin(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setAdminSession(data.token, data.admin);
      return { ok: true };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error ?? "Invalid credentials" };
  } catch {
    return { ok: false, error: "Connection failed" };
  }
}
