export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";

import { useMutation } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export function useCreatePortal() {
  return useMutation({
    mutationFn: async () =>
      customFetch<{ url: string }>("/api/payments/create-portal", {
        method: "POST",
        body: "{}",
      }),
  });
}
