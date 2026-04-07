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
  return localStorage.getItem(TOKEN_KEY);
}

export function getAdminUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AdminUser; } catch { return null; }
}

export function setAdminSession(token: string, user: AdminUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAdminSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401) {
    clearAdminSession();
    window.location.href = "/admin/login";
  }
  return res;
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
