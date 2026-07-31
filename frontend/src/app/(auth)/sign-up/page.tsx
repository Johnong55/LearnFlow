import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Tạo tài khoản",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="START SMALL, GROW STEADILY"
      title="Build a plan you can keep."
      description="Create your account, then tell us about your goal and the life your learning needs to fit."
    >
      <SignUpForm />
    </AuthShell>
  );
}
