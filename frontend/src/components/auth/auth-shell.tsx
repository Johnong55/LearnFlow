import { Brain, CalendarCheck2, ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { AppLogo } from "@/components/layout/app-logo";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-background grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex min-h-screen items-center px-5 py-24 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <AppLogo className="mb-12" />
          <p className="text-primary-strong mb-3 text-sm font-semibold">
            {eyebrow}
          </p>
          <h1 className="font-display text-4xl leading-[1.05] font-bold tracking-[-0.04em] sm:text-5xl">
            {title}
          </h1>
          <p className="text-muted-foreground mt-4 leading-7">{description}</p>
          <div className="mt-9">{children}</div>
        </div>
      </section>
      <aside
        className="bg-primary-deep dark:bg-surface relative hidden overflow-hidden p-10 text-white lg:grid lg:place-items-center"
        aria-label="Xem trước SkillPilot"
      >
        <div className="grid-dots absolute inset-0 opacity-20" />
        <div className="bg-primary/20 absolute -top-20 -right-20 size-72 rounded-full blur-3xl" />
        <div className="bg-info/15 absolute -bottom-24 -left-24 size-80 rounded-full blur-3xl" />
        <div className="relative w-full max-w-xl">
          <div className="mb-8 max-w-lg">
            <Sparkles className="text-primary mb-5 size-7" />
            <h2 className="font-display text-4xl leading-tight font-bold">
              A steady plan for an ambitious goal.
            </h2>
            <p className="mt-4 leading-7 text-white/65">
              Your roadmap adapts around the life you already have—not the other
              way around.
            </p>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-semibold">
                Tonight’s balanced plan
              </span>
              <span className="bg-primary/20 text-primary rounded-full px-3 py-1 text-xs">
                On track
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-[20px] bg-white/[0.07] p-4">
                <span className="bg-info/20 text-info grid size-10 place-items-center rounded-2xl">
                  <CalendarCheck2 className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">19:00 · Async JavaScript</p>
                  <p className="mt-1 text-xs text-white/55">
                    45 min · high-energy window
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[20px] bg-white/[0.07] p-4">
                <span className="bg-primary/20 text-primary grid size-10 place-items-center rounded-2xl">
                  <Brain className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">Next: build one API route</p>
                  <p className="mt-1 text-xs text-white/55">
                    Hands-on · Milestone 2
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-white/60">
            <ShieldCheck className="text-primary size-4" />
            Refresh sessions stay protected in secure cookies.
          </p>
        </div>
      </aside>
    </main>
  );
}
