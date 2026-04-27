export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";

import { useMutation, useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// Get list of users the current user has liked (pending — no mutual match yet)
export function useGetSentLikes(options?: { query?: Record<string, any> }) {
  return useQuery({
    queryKey: ["/api/matches/sent"],
    queryFn: () =>
      customFetch<{ sent: any[]; count: number }>("/api/matches/sent"),
    ...options?.query,
  });
}

// Pass on someone who liked you (from received likes section)
export function usePassLiker() {
  return useMutation({
    mutationFn: async (userId: string) =>
      customFetch<{ ok: boolean }>(`/api/matches/pass/${userId}`, {
        method: "POST",
        body: "{}",
      }),
  });
}

export function useCreatePortal() {
  return useMutation({
    mutationFn: async () =>
      customFetch<{ url: string }>("/api/payments/create-portal", {
        method: "POST",
        body: "{}",
      }),
  });
}

// Check if current user has liked or is matched with another user
export function useGetMatchStatus(userId: string) {
  return useQuery({
    queryKey: ["/api/matches/status", userId],
    queryFn: () =>
      customFetch<{ liked: boolean; matched: boolean }>(
        `/api/matches/status/${userId}`
      ),
    enabled: !!userId,
  });
}

// Unlike a user (undo a non-mutual like)
export function useUnlikeUser() {
  return useMutation({
    mutationFn: async (userId: string) =>
      customFetch<{ ok: boolean }>(`/api/matches/like/${userId}`, {
        method: "DELETE",
      }),
  });
}

// Unmatch a mutual match (deletes both likes and all messages)
export function useUnmatch() {
  return useMutation({
    mutationFn: async (userId: string) =>
      customFetch<{ ok: boolean }>(`/api/matches/unmatch/${userId}`, {
        method: "POST",
        body: "{}",
      }),
  });
}

// Block a user (also unmatches and deletes messages)
export function useBlockUser() {
  return useMutation({
    mutationFn: async (userId: string) =>
      customFetch<{ ok: boolean }>(`/api/users/${userId}/block`, {
        method: "POST",
        body: "{}",
      }),
  });
}

// Unblock a user
export function useUnblockUser() {
  return useMutation({
    mutationFn: async (userId: string) =>
      customFetch<{ ok: boolean }>(`/api/users/${userId}/block`, {
        method: "DELETE",
      }),
  });
}

// Get list of users the current user has blocked
export function useGetBlockedUsers() {
  return useQuery({
    queryKey: ["/api/users/me/blocked"],
    queryFn: () =>
      customFetch<{ blocked: any[] }>("/api/users/me/blocked"),
  });
}

// Extended payment status — includes paymentsLive flag + free-tier daily limits
export interface DailyLimitsSnapshot {
  messagesLimit: number;
  messagesUsed: number;
  messagesRemaining: number;
  likesLimit: number;
  likesUsed: number;
  likesRemaining: number;
  resetsAt: number;
}
export interface FreeTierLimits {
  messagesPerDay: number;
  likesPerDay: number;
}
export interface PaymentStatusFull {
  tier: string;
  hasBadge: boolean;
  paymentsLive: boolean;
  dailyLimits: DailyLimitsSnapshot | null;
  freeTierLimits?: FreeTierLimits;
}
export function usePaymentStatusFull(options?: { query?: Record<string, any> }) {
  return useQuery({
    queryKey: ["/api/payments/status", "full"],
    queryFn: () => customFetch<PaymentStatusFull>("/api/payments/status"),
    ...options?.query,
  });
}

// Capture interest for a paid plan while payments aren't live yet
export function useSubmitUpgradeInterest() {
  return useMutation({
    mutationFn: async (plan: "core" | "badge") =>
      customFetch<{ success: boolean; alreadyRegistered: boolean; plan: string; email: string }>(
        "/api/payments/upgrade-interest",
        {
          method: "POST",
          body: JSON.stringify({ plan }),
          headers: { "Content-Type": "application/json" },
        },
      ),
  });
}

// Public count of how many users have registered interest in each plan
export function useGetUpgradeInterestCount(options?: { query?: Record<string, any> }) {
  return useQuery({
    queryKey: ["/api/payments/upgrade-interest/count"],
    queryFn: () =>
      customFetch<{ counts: { core: number; badge: number } }>(
        "/api/payments/upgrade-interest/count",
      ),
    ...options?.query,
  });
}

// Submit a report against another user
export function useSubmitReport() {
  return useMutation({
    mutationFn: async (data: {
      reportedUserId: string;
      reason: string;
      details?: string;
    }) =>
      customFetch<{ ok: boolean }>("/api/reports", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
  });
}
