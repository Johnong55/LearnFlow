"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { NAVIGATION } from "@/config/site";
import { authApi } from "@/lib/api/auth.api";
import { drawerMotion } from "@/lib/motion/tokens";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth-store";

async function restoreMarketingSession() {
  try {
    return await authApi.me();
  } catch {
    await authApi.refresh();
    return authApi.me();
  }
}

export function MarketingHeader() {
  const storedUser = useAuthStore((state) => state.user);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const session = useQuery({
    queryKey: queryKeys.user.current,
    queryFn: restoreMarketingSession,
    enabled: !storedUser,
    retry: false,
  });
  const user = storedUser ?? session.data;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 18);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sections = NAVIGATION.map(({ href }) =>
      document.querySelector(href.slice(1)),
    ).filter(Boolean) as Element[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveSection(`#${visible.target.id}`);
      },
      { rootMargin: "-35% 0px -55%" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 px-2 transition-all duration-300 sm:px-4",
      )}
    >
      <div
        className={cn(
          "page-shell pointer-events-auto flex h-[76px] items-center justify-between gap-4 rounded-[22px] border border-transparent px-0 transition-all duration-300",
          scrolled &&
            "border-border/75 bg-background/86 mt-2 h-[64px] px-3 shadow-[0_18px_55px_-34px_rgb(24_57_43/0.55)] backdrop-blur-xl sm:px-4",
        )}
      >
        <AppLogo />
        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center gap-1 lg:flex"
        >
          {NAVIGATION.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-muted-foreground hover:bg-surface-muted hover:text-foreground focus-visible:ring-ring/35 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3",
                activeSection === item.href.slice(1) &&
                  "bg-primary-soft text-primary-deep",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          {user ? (
            <Button asChild>
              <Link href="/app">
                Vào ứng dụng
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          ) : session.isPending ? (
            <Button
              variant="secondary"
              disabled
              loading
              loadingLabel="Đang kiểm tra phiên…"
            >
              Đang kiểm tra phiên…
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">
                  Build my roadmap
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mở menu">
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </Dialog.Trigger>
            <AnimatePresence>
              {menuOpen ? (
                <Dialog.Portal forceMount>
                  <Dialog.Overlay asChild>
                    <motion.div
                      className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  </Dialog.Overlay>
                  <Dialog.Content asChild>
                    <motion.aside
                      variants={drawerMotion}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="bg-surface fixed inset-y-0 right-0 z-50 flex w-[min(88vw,380px)] flex-col p-6 shadow-2xl outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <Dialog.Title asChild>
                          <span className="font-display text-xl font-bold">
                            Menu
                          </span>
                        </Dialog.Title>
                        <Dialog.Close asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Đóng menu"
                          >
                            <X className="size-5" aria-hidden="true" />
                          </Button>
                        </Dialog.Close>
                      </div>
                      <nav
                        className="mt-10 grid gap-2"
                        aria-label="Điều hướng di động"
                      >
                        {NAVIGATION.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className="hover:bg-surface-muted focus-visible:ring-ring/35 rounded-2xl px-4 py-4 text-lg font-semibold outline-none focus-visible:ring-3"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </nav>
                      <div className="mt-auto grid gap-3">
                        {user ? (
                          <Button asChild size="lg">
                            <Link
                              href="/app"
                              onClick={() => setMenuOpen(false)}
                            >
                              Vào ứng dụng
                            </Link>
                          </Button>
                        ) : session.isPending ? (
                          <Button
                            size="lg"
                            variant="secondary"
                            disabled
                            loading
                            loadingLabel="Đang kiểm tra phiên…"
                          >
                            Đang kiểm tra phiên…
                          </Button>
                        ) : (
                          <>
                            <Button asChild variant="secondary" size="lg">
                              <Link
                                href="/sign-in"
                                onClick={() => setMenuOpen(false)}
                              >
                                Sign in
                              </Link>
                            </Button>
                            <Button asChild size="lg">
                              <Link
                                href="/sign-up"
                                onClick={() => setMenuOpen(false)}
                              >
                                Build my roadmap
                              </Link>
                            </Button>
                          </>
                        )}
                      </div>
                    </motion.aside>
                  </Dialog.Content>
                </Dialog.Portal>
              ) : null}
            </AnimatePresence>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
