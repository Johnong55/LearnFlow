import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="RECOVER YOUR ACCOUNT"
      title="Let’s get you back on course."
      description="Enter your email and we’ll help you securely set a new password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
