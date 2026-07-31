"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { InlineAlert } from "@/components/feedback/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/features/auth/validation";
import { authApi } from "@/lib/api/auth.api";
import { isApiError } from "@/lib/api/errors";

export function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const mutation = useMutation({
    mutationFn: ({ email }: ForgotPasswordValues) =>
      authApi.forgotPassword(email),
  });

  if (mutation.isSuccess) {
    return (
      <div className="text-center" role="status">
        <span className="bg-success-soft text-success mx-auto grid size-16 place-items-center rounded-[22px]">
          <MailCheck className="size-7" aria-hidden="true" />
        </span>
        <h2 className="font-display mt-6 text-2xl font-bold">
          Check your inbox
        </h2>
        <p className="text-muted-foreground mt-3 leading-7">
          Nếu tài khoản tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi tới{" "}
          <strong className="text-foreground">{form.getValues("email")}</strong>
          .
        </p>
        <Button asChild variant="secondary" className="mt-7 w-full">
          <Link href="/sign-in">
            <ArrowLeft className="size-4" />
            Quay lại đăng nhập
          </Link>
        </Button>
      </div>
    );
  }

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
            : "Không thể gửi yêu cầu. Vui lòng thử lại."}
        </InlineAlert>
      ) : null}
      <Input
        label="Email tài khoản"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="ban@example.com"
        description="Chúng tôi sẽ gửi hướng dẫn nếu email này thuộc một tài khoản."
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={mutation.isPending}
        loadingLabel="Đang gửi hướng dẫn..."
      >
        Gửi hướng dẫn
      </Button>
      <Button asChild variant="ghost" className="w-full">
        <Link href="/sign-in">
          <ArrowLeft className="size-4" />
          Quay lại đăng nhập
        </Link>
      </Button>
    </form>
  );
}
