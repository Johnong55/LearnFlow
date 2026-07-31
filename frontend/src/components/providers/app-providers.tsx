"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import { AuthSessionListener } from "@/components/providers/auth-session-listener";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              const status =
                typeof error === "object" && error && "status" in error
                  ? Number(error.status)
                  : undefined;
              return status && status < 500 ? false : failureCount < 2;
            },
          },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthSessionListener />
        {children}
        <Toaster
          position="top-right"
          closeButton
          richColors
          toastOptions={{ className: "font-body" }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
