"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { InlineAlert } from "@/components/feedback/inline-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpSchema, type SignUpValues } from "@/features/auth/validation";
import { authApi } from "@/lib/api/auth.api";
import { isApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth-store";

export function SignUpForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });
  const accepted = useWatch({ control: form.control, name: "acceptTerms" });
  const mutation = useMutation({
    mutationFn: ({ fullName, email, password }: SignUpValues) =>
      authApi.signUp({ fullName, email, password }),
    onSuccess: ({ user, tokens }) => {
      setSession(user, tokens.accessToken);
      toast.success("Tài khoản đã sẵn sàng", {
        description: "Bước tiếp theo là xây kế hoạch quanh cuộc sống của bạn.",
      });
      router.replace("/onboarding/welcome");
    },
  });

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
            : "Không thể tạo tài khoản. Vui lòng thử lại."}
        </InlineAlert>
      ) : null}
      <Input
        label="Tên hiển thị"
        autoComplete="name"
        placeholder="Nguyễn Minh Trí"
        error={form.formState.errors.fullName?.message}
        {...form.register("fullName")}
      />
      <Input
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="ban@example.com"
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      <PasswordInput
        label="Mật khẩu"
        description="Ít nhất 12 ký tự. Một cụm từ dài, dễ nhớ sẽ an toàn hơn."
        autoComplete="new-password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      <PasswordInput
        label="Nhập lại mật khẩu"
        autoComplete="new-password"
        error={form.formState.errors.confirmPassword?.message}
        {...form.register("confirmPassword")}
      />
      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            className="peer sr-only"
            {...form.register("acceptTerms")}
          />
          <span
            className={cn(
              "border-border bg-surface peer-focus-visible:ring-ring/35 mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors peer-focus-visible:ring-3",
              accepted && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {accepted ? (
              <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
            ) : null}
          </span>
          <span className="text-muted-foreground">
            Tôi đồng ý với{" "}
            <Link
              href="/terms"
              className="text-foreground font-semibold underline underline-offset-3"
            >
              Điều khoản
            </Link>{" "}
            và{" "}
            <Link
              href="/privacy"
              className="text-foreground font-semibold underline underline-offset-3"
            >
              Quyền riêng tư
            </Link>
            .
          </span>
        </label>
        {form.formState.errors.acceptTerms ? (
          <p role="alert" className="text-danger mt-2 text-sm">
            {form.formState.errors.acceptTerms.message}
          </p>
        ) : null}
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={mutation.isPending}
        loadingLabel="Đang tạo tài khoản..."
      >
        Tạo tài khoản
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        Đã có tài khoản?{" "}
        <Link
          href="/sign-in"
          className="text-foreground decoration-primary/50 font-semibold underline underline-offset-4"
        >
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
