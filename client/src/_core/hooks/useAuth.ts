/** Atelier fiscal moderne — état du compte e-mail et session HttpOnly, sans localStorage. */

import { trpc } from "@/lib/trpc";
import { useCallback, useEffect } from "react";
import { useLocation } from "wouter";

type UseAuthOptions = { redirectOnUnauthenticated?: boolean; redirectPath?: string };

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/connexion" } = options ?? {};
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const meQuery = trpc.account.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const logoutMutation = trpc.account.logout.useMutation({ onSuccess: () => utils.account.me.setData(undefined, null) });

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    await utils.account.me.invalidate();
  }, [logoutMutation, utils]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || meQuery.isLoading || logoutMutation.isPending || meQuery.data) return;
    if (window.location.pathname !== redirectPath) setLocation(redirectPath);
  }, [meQuery.data, meQuery.isLoading, logoutMutation.isPending, redirectOnUnauthenticated, redirectPath, setLocation]);

  return {
    user: meQuery.data ?? null,
    loading: meQuery.isLoading || logoutMutation.isPending,
    error: meQuery.error ?? logoutMutation.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
    refresh: () => meQuery.refetch(),
    logout,
  };
}
