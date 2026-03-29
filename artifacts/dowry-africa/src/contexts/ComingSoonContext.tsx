import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { API_BASE } from "@/lib/api-url";

interface ComingSoonConfig {
  comingSoonMode: boolean;
  headline: string;
  subtext: string;
  exclusivity: string;
  buttonText: string;
  successMessage: string;
}

interface ComingSoonContextValue extends ComingSoonConfig {
  refresh: () => void;
}

const defaultConfig: ComingSoonConfig = {
  comingSoonMode: false,
  headline: "Built for marriage. Not just matches.",
  subtext: "",
  exclusivity: "",
  buttonText: "Request early access",
  successMessage: "You're on the list. We'll be in touch soon.",
};

const ComingSoonCtx = createContext<ComingSoonContextValue>({
  ...defaultConfig,
  refresh: () => {},
});

export function ComingSoonProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ComingSoonConfig>(defaultConfig);

  const refresh = useCallback(() => {
    fetch(`${API_BASE}/api/early-access/config`, { cache: "no-cache" })
      .then(r => r.json())
      .then(d => setConfig({
        comingSoonMode: !!d.comingSoonMode,
        headline: d.headline ?? defaultConfig.headline,
        subtext: d.subtext ?? defaultConfig.subtext,
        exclusivity: d.exclusivity ?? defaultConfig.exclusivity,
        buttonText: d.buttonText ?? defaultConfig.buttonText,
        successMessage: d.successMessage ?? defaultConfig.successMessage,
      }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ComingSoonCtx.Provider value={{ ...config, refresh }}>
      {children}
    </ComingSoonCtx.Provider>
  );
}

export function useComingSoon() {
  return useContext(ComingSoonCtx);
}
