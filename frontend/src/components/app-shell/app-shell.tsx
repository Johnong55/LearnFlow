"use client";

import { useMutation } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  Home,
  ListChecks,
  LibraryBig,
  LogOut,
  Menu,
  MoreHorizontal,
  Route,
  Settings,
  Target,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { AppLogo } from "@/components/layout/app-logo";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth.api";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

const navigation = [
  { href: "/app", label: "Tổng quan", icon: Home, exact: true },
  { href: "/app/today", label: "Hôm nay", icon: ListChecks, exact: false },
  { href: "/app/roadmap", label: "Roadmap", icon: Route, exact: false },
  { href: "/app/calendar", label: "Lịch", icon: CalendarDays, exact: false },
  { href: "/app/goals", label: "Mục tiêu", icon: Target, exact: false },
  {
    href: "/app/progress",
    label: "Tiến độ",
    icon: ChartNoAxesColumnIncreasing,
    exact: false,
  },
  { href: "/app/routines", label: "Routines", icon: BookOpen, exact: false },
  {
    href: "/app/resources",
    label: "Tài nguyên",
    icon: LibraryBig,
    exact: false,
  },
  { href: "/app/settings", label: "Cài đặt", icon: Settings, exact: false },
];

const mobileNavigation = [
  navigation[1]!,
  navigation[2]!,
  navigation[3]!,
  navigation[5]!,
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const logout = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearSession();
      router.replace("/sign-in");
    },
  });
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div
      className="bg-background min-h-screen lg:grid"
      style={{ gridTemplateColumns: collapsed ? "5.5rem 1fr" : "17rem 1fr" }}
    >
      <aside
        className={cn(
          "border-border bg-surface fixed inset-y-0 left-0 z-40 hidden border-r transition-[width] duration-200 lg:flex lg:flex-col",
          collapsed ? "w-[5.5rem]" : "w-[17rem]",
        )}
      >
        <div className="flex h-20 items-center px-5">
          <AppLogo
            compact={collapsed}
            href="/app"
            destinationLabel="Tổng quan"
          />
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Điều hướng ứng dụng">
          {navigation.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href, exact) ? "page" : undefined}
              className={cn(
                "text-muted-foreground hover:bg-surface-muted hover:text-foreground focus-visible:ring-ring/35 flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-colors outline-none focus-visible:ring-3",
                isActive(href, exact) && "bg-primary-soft text-primary-strong",
                collapsed && "justify-center",
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="size-5 shrink-0" />
              {collapsed ? <span className="sr-only">{label}</span> : label}
            </Link>
          ))}
        </nav>
        <div className="border-border border-t p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl p-2",
              collapsed && "justify-center",
            )}
          >
            <span className="bg-primary-soft text-primary-strong grid size-10 shrink-0 place-items-center rounded-xl">
              <UserRound className="size-5" />
            </span>
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {user?.profile?.fullName ?? "Người học"}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {user?.email}
                </p>
              </div>
            ) : null}
          </div>
          {!collapsed ? (
            <Button
              variant="ghost"
              className="mt-1 w-full justify-start"
              loading={logout.isPending}
              onClick={() => logout.mutate()}
            >
              <LogOut className="size-4" /> Đăng xuất
            </Button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          className="border-border bg-surface focus-visible:ring-ring/35 absolute top-24 -right-4 grid size-8 place-items-center rounded-full border shadow-sm outline-none focus-visible:ring-3"
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </aside>

      <div
        className={cn(
          "min-w-0",
          collapsed ? "lg:col-start-2" : "lg:col-start-2",
        )}
      >
        <header className="border-border/70 bg-background/85 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur-xl lg:px-8">
          <button
            type="button"
            className="focus-visible:ring-ring/35 grid size-11 place-items-center rounded-xl outline-none focus-visible:ring-3 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Mở menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <AppLogo compact href="/app" destinationLabel="Tổng quan" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <p className="text-muted-foreground hidden text-sm sm:block">
              Kế hoạch quanh cuộc sống thật của bạn
            </p>
            <NotificationCenter />
          </div>
        </header>
        {mobileOpen ? (
          <div className="border-border bg-surface fixed inset-x-4 top-18 z-40 rounded-[22px] border p-2 shadow-xl lg:hidden">
            {navigation.map(({ href, label, icon: Icon, exact }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold",
                  isActive(href, exact) &&
                    "bg-primary-soft text-primary-strong",
                )}
              >
                <Icon className="size-5" /> {label}
              </Link>
            ))}
          </div>
        ) : null}
        <main className="mx-auto w-full max-w-[90rem] px-4 py-7 pb-24 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>

      <nav
        className="border-border bg-surface/95 fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t px-1 pb-[max(.4rem,env(safe-area-inset-bottom))] lg:hidden"
        aria-label="Điều hướng di động"
      >
        {mobileNavigation.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "text-muted-foreground flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
              isActive(href, exact) && "text-primary-strong",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className={cn(
            "text-muted-foreground flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
            mobileOpen && "text-primary-strong",
          )}
          aria-label="Mở thêm điều hướng"
          aria-expanded={mobileOpen}
        >
          <MoreHorizontal className="size-5" />
          Thêm
        </button>
      </nav>
    </div>
  );
}
