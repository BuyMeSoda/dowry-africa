import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { API_BASE } from "@/lib/api-url";
import App from "./App";
import "./index.css";

if (API_BASE) setBaseUrl(API_BASE);
setAuthTokenGetter(() => localStorage.getItem("da_token"));

export const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
