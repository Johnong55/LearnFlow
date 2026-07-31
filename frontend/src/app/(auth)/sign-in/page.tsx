import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Đăng nhập",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Continue your next meaningful step."
      description="Sign in to see today’s focus, your roadmap, and a schedule that still fits."
    >
      <SignInForm />
    </AuthShell>
  );
}
