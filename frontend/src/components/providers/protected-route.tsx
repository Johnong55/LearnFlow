"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { authApi } from "@/lib/api/auth.api";
import { queryKeys } from "@/lib/query/keys";
import { useAuthStore } from "@/stores/auth-store";

async function restoreSession() {
  try {
    return await authApi.me();
  } catch {
    await authApi.refresh();
    return authApi.me();
  }
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const query = useQuery({
    queryKey: queryKeys.user.current,
    queryFn: restoreSession,
    enabled: !user,
    retry: false,
  });
  const resolvedUser = user ?? query.data;

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);

  useEffect(() => {
    if (query.isError) router.replace("/sign-in?next=/app");
    if (resolvedUser && !resolvedUser.onboardingCompletedAt)
      router.replace("/onboarding/welcome");
  }, [query.isError, resolvedUser, router]);

  if (!resolvedUser || !resolvedUser.onboardingCompletedAt) {
    return (
      <main className="bg-background grid min-h-screen place-items-center p-6">
        <div className="text-center" role="status">
          <div className="border-primary/20 border-t-primary mx-auto mb-4 size-10 animate-spin rounded-full border-3" />
          <p className="text-muted-foreground text-sm">
            Đang mở không gian của bạn…
          </p>
        </div>
      </main>
    );
  }

  return children;
}
