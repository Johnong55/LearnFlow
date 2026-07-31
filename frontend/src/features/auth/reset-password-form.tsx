"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { InlineAlert } from "@/components/feedback/inline-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/features/auth/validation";
import { authApi } from "@/lib/api/auth.api";
import { isApiError } from "@/lib/api/errors";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const mutation = useMutation({
    mutationFn: ({ password }: ResetPasswordValues) =>
      authApi.resetPassword(token, password),
  });

  if (!token)
    return (
      <InlineAlert tone="error">
        Liên kết đặt lại mật khẩu không hợp lệ hoặc đã thiếu token. Hãy yêu cầu
        một liên kết mới.
      </InlineAlert>
    );
  if (mutation.isSuccess)
    return (
      <div className="text-center" role="status">
        <CheckCircle2 className="text-success mx-auto size-14" />
        <h2 className="font-display mt-5 text-2xl font-bold">
          Password updated
        </h2>
        <p className="text-muted-foreground mt-3">
          Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.
        </p>
        <Button asChild className="mt-7 w-full">
          <Link href="/sign-in">Đăng nhập</Link>
        </Button>
      </div>
    );

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      {mutation.error ? (
        <InlineAlert tone="error">
          {isApiError(mutation.error)
            ? mutation.error.message
            : "Không thể đổi mật khẩu. Vui lòng thử lại."}
        </InlineAlert>
      ) : null}
      <PasswordInput
        label="Mật khẩu mới"
        description="Dùng ít nhất 12 ký tự."
        autoComplete="new-password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      <PasswordInput
        label="Nhập lại mật khẩu mới"
        autoComplete="new-password"
        error={form.formState.errors.confirmPassword?.message}
        {...form.register("confirmPassword")}
      />
      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={mutation.isPending}
        loadingLabel="Đang cập nhật..."
      >
        Đặt mật khẩu mới
      </Button>
    </form>
  );
}
