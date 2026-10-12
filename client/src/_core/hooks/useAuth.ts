import { startLogin } from "@/const";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => utils.auth.me.setData(undefined, null),
  });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      void queryClient.invalidateQueries({ queryKey: ["ukk"] });
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      utils.auth.me.setData(undefined, null);
      queryClient.removeQueries({
        predicate: (query) => JSON.stringify(query.queryKey).includes('"ukk"'),
      });
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils, queryClient]);

  const state = useMemo(
    () => ({
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    }),
    [
      meQuery.data,
      meQuery.error,
      meQuery.isLoading,
      logoutMutation.error,
      logoutMutation.isPending,
    ],
  );

  useEffect(() => {
    if (
      !redirectOnUnauthenticated ||
      meQuery.isLoading ||
      logoutMutation.isPending
    )
      return;
    if (state.user || typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;
    if (redirectPath) window.location.href = redirectPath;
    else void startLogin();
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return { ...state, refresh: () => meQuery.refetch(), logout };
}
