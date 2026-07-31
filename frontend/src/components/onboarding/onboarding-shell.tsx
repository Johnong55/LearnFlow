"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Cloud, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { AppLogo } from "@/components/layout/app-logo";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth.api";
import { queryKeys } from "@/lib/query/keys";
import { motionTokens } from "@/lib/motion/tokens";
import { useAuthStore } from "@/stores/auth-store";
import { useOnboardingStore } from "@/stores/onboarding-store";

export const ONBOARDING_STEPS = [
  { slug: "welcome", label: "Bắt đầu" },
  { slug: "about-you", label: "Về bạn" },
  { slug: "work", label: "Công việc" },
  { slug: "sleep", label: "Giấc ngủ" },
  { slug: "routines", label: "Thói quen" },
  { slug: "energy", label: "Năng lượng" },
  { slug: "skills", label: "Kỹ năng" },
  { slug: "goal", label: "Mục tiêu" },
  { slug: "preferences", label: "Sở thích" },
  { slug: "review", label: "Kiểm tra" },
] as const;

async function restoreSession() {
  try {
    return await authApi.me();
  } catch {
    await authApi.refresh();
    return authApi.me();
  }
}

export function OnboardingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const lastSavedAt = useOnboardingStore((state) => state.lastSavedAt);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const slug = pathname.split("/").filter(Boolean).at(-1) ?? "welcome";
  const stepIndex = ONBOARDING_STEPS.findIndex((step) => step.slug === slug);
  const isGenerating = slug === "generating";

  const sessionQuery = useQuery({
    queryKey: queryKeys.user.current,
    queryFn: restoreSession,
    enabled: !user,
    retry: false,
  });

  useEffect(() => {
    if (sessionQuery.data) setUser(sessionQuery.data);
  }, [sessionQuery.data, setUser]);

  useEffect(() => {
    if (sessionQuery.isError)
      router.replace("/sign-in?next=/onboarding/welcome");
  }, [router, sessionQuery.isError]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  if (!user && (sessionQuery.isPending || sessionQuery.isError)) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="text-center" role="status" aria-live="polite">
          <div className="border-primary/25 border-t-primary mx-auto mb-4 size-9 animate-spin rounded-full border-3" />
          <p className="text-muted-foreground text-sm">
            Đang mở bản kế hoạch của bạn…
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="bg-background relative min-h-screen overflow-hidden">
      <div className="bg-primary/10 pointer-events-none absolute -top-40 -right-32 size-[28rem] rounded-full blur-3xl" />
      <div className="bg-info/10 pointer-events-none absolute bottom-0 -left-48 size-[30rem] rounded-full blur-3xl" />
      <header className="border-border/75 bg-background/82 sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex min-h-18 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <AppLogo />
          {!isGenerating ? (
            <div className="hidden min-w-56 flex-1 px-10 md:block">
              <div
                className="bg-muted h-2 overflow-hidden rounded-full"
                aria-label={`Tiến độ ${Math.max(stepIndex + 1, 1)} trên ${ONBOARDING_STEPS.length}`}
              >
                <motion.div
                  className="bg-primary h-full rounded-full"
                  animate={{
                    width: `${((Math.max(stepIndex, 0) + 1) / ONBOARDING_STEPS.length) * 100}%`,
                  }}
                  transition={motionTokens.spring.gentle}
                />
              </div>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <span
              className="text-muted-foreground hidden items-center gap-1.5 text-xs sm:flex"
              aria-live="polite"
            >
              {lastSavedAt ? (
                <Check className="text-success size-3.5" />
              ) : (
                <Cloud className="size-3.5" />
              )}
              {lastSavedAt ? "Đã lưu bản nháp" : "Tự động lưu trên thiết bị"}
            </span>
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <LogOut className="size-4" /> Lưu & thoát
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        {!isGenerating && stepIndex >= 0 ? (
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-primary-strong text-xs font-bold tracking-[0.14em] uppercase">
                Bước {stepIndex + 1} / {ONBOARDING_STEPS.length}
              </p>
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="font-display mt-1 text-2xl font-bold tracking-[-0.03em] outline-none sm:text-3xl"
              >
                {ONBOARDING_STEPS[stepIndex]?.label}
              </h1>
            </div>
            {stepIndex > 0 ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="size-4" /> Quay lại
              </Button>
            ) : null}
          </div>
        ) : null}

        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: motionTokens.duration.normal,
            ease: motionTokens.easing.enter,
          }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
