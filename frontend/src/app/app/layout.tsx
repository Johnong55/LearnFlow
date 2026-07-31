import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { ProtectedRoute } from "@/components/providers/protected-route";

export const metadata: Metadata = {
  title: "Không gian học tập",
  robots: { index: false, follow: false },
};

export default function ProtectedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
