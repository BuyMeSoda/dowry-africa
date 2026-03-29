import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { API_BASE } from "@/lib/api-url";

interface WaitlistContextValue {
  waitlistMode: boolean;
  refresh: () => void;
}

const WaitlistCtx = createContext<WaitlistContextValue>({
  waitlistMode: false,
  refresh: () => {},
});

export function WaitlistProvider({ children }: { children: ReactNode }) {
  const [waitlistMode, setWaitlistMode] = useState(false);

  const refresh = useCallback(() => {
    fetch(`${API_BASE}/api/waitlist/status`, { cache: "no-cache" })
      .then(r => r.json())
      .then(d => setWaitlistMode(!!d.waitlistMode))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <WaitlistCtx.Provider value={{ waitlistMode, refresh }}>
      {children}
    </WaitlistCtx.Provider>
  );
}

export function useWaitlist() {
  return useContext(WaitlistCtx);
}
