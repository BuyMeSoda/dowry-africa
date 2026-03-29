import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { API_BASE } from "@/lib/api-url";

interface NotifCounts {
  total: number;
  likes: number;
  matches: number;
  messages: number;
}

interface NotificationsContextValue {
  counts: NotifCounts;
  refresh: () => void;
  markSeen: (type?: "like" | "match" | "message") => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  counts: { total: 0, likes: 0, matches: 0, messages: 0 },
  refresh: () => {},
  markSeen: () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NotifCounts>({ total: 0, likes: 0, matches: 0, messages: 0 });

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("da_token");
      const res = await fetch(`${API_BASE}/api/notifications/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    } catch {}
  }, [user]);

  const markSeen = useCallback(async (type?: "like" | "match" | "message") => {
    try {
      const token = localStorage.getItem("da_token");
      await fetch(`${API_BASE}/api/notifications/seen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(type ? { type } : {}),
      });
      setCounts(prev => type
        ? { ...prev, [type + "s"]: 0, total: Math.max(0, prev.total - prev[type + "s" as keyof NotifCounts] as number) }
        : { total: 0, likes: 0, matches: 0, messages: 0 }
      );
    } catch {}
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    if (!user) return;
    fetchCounts();
    const interval = setInterval(fetchCounts, 30_000);
    return () => clearInterval(interval);
  }, [user, fetchCounts]);

  return (
    <NotificationsContext.Provider value={{ counts, refresh: fetchCounts, markSeen }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
