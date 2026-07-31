import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="CHOOSE A NEW PASSWORD"
      title="Secure your next chapter."
      description="Create a strong new password, then continue your learning plan."
    >
      <Suspense
        fallback={
          <div className="grid min-h-40 place-items-center">
            <LoadingSpinner label="Đang mở biểu mẫu" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
