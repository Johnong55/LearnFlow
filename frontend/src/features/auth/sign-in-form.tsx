"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PasswordInput } from "@/components/forms/password-input";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth.api";
import { isApiError } from "@/lib/api/errors";
import { useAuthStore } from "@/stores/auth-store";
import { signInSchema, type SignInValues } from "@/features/auth/validation";

export function SignInForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const mutation = useMutation({
    mutationFn: (values: SignInValues) => authApi.signIn(values),
    onSuccess: ({ user, tokens }) => {
      setSession(user, tokens.accessToken);
      toast.success("Đăng nhập thành công", {
        description: "Chào mừng bạn trở lại SkillPilot.",
      });
      router.replace(
        user.onboardingCompletedAt ? "/app" : "/onboarding/welcome",
      );
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
            : "Không thể đăng nhập. Vui lòng thử lại."}
        </InlineAlert>
      ) : null}
      <Input
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="ban@example.com"
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      <div>
        <PasswordInput
          label="Mật khẩu"
          autoComplete="current-password"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <div className="mt-3 text-right">
          <Link
            href="/forgot-password"
            className="text-primary-strong focus-visible:ring-ring/35 rounded text-sm font-semibold outline-none hover:underline focus-visible:ring-3"
          >
            Quên mật khẩu?
          </Link>
        </div>
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={mutation.isPending}
        loadingLabel="Đang đăng nhập..."
      >
        Đăng nhập
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        Chưa có tài khoản?{" "}
        <Link
          href="/sign-up"
          className="text-foreground decoration-primary/50 hover:decoration-primary font-semibold underline underline-offset-4"
        >
          Tạo tài khoản
        </Link>
      </p>
    </form>
  );
}
