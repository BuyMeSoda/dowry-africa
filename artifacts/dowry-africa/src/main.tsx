import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
if (apiBase) setBaseUrl(apiBase);
setAuthTokenGetter(() => localStorage.getItem("da_token"));

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
