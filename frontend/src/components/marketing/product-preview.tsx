"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpenCheck,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  Flame,
  Target,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { DisplayHeading } from "@/components/ui/display-heading";
import { fadeScale, motionTokens } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

const tabs = ["Today", "Roadmap", "Calendar", "Progress"] as const;
type Tab = (typeof tabs)[number];

function RoadmapPreview() {
  return (
    <div className="space-y-3">
      {[
        "JavaScript foundations",
        "Build reliable APIs",
        "Ship a production project",
      ].map((item, index) => (
        <div
          key={item}
          className="border-border bg-background flex items-center gap-4 rounded-[20px] border p-4"
        >
          <span
            className={cn(
              "grid size-10 place-items-center rounded-2xl",
              index === 0
                ? "bg-success text-white"
                : "bg-primary-soft text-primary-deep",
            )}
          >
            {index === 0 ? (
              <Check className="size-5" />
            ) : (
              <span className="font-display text-sm font-bold">
                {index + 1}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{item}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {index === 0
                ? "6 of 6 tasks complete"
                : `${index + 2} modules · ${index + 3} weeks`}
            </p>
          </div>
          <Badge tone={index === 0 ? "success" : "neutral"}>
            {index === 0 ? "Done" : "Next"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function WeeklyPreview() {
  return (
    <div className="grid grid-cols-5 gap-2">
      {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => (
        <div key={day} className="min-w-0">
          <p className="text-muted-foreground mb-3 text-center text-xs font-semibold">
            {day}
          </p>
          <div className="space-y-2">
            <div className="bg-info-soft text-info-foreground h-16 rounded-xl p-2 text-[10px] font-semibold">
              Work
            </div>
            {index === 1 || index === 3 ? (
              <div className="bg-primary-soft text-primary-deep h-12 rounded-xl p-2 text-[10px] font-semibold">
                Study
              </div>
            ) : (
              <div className="bg-surface-muted h-7 rounded-xl" />
            )}
            <div className="bg-accent-soft text-accent-foreground h-8 rounded-xl p-2 text-[10px] font-semibold">
              Life
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FocusPreview() {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <Badge tone="primary">NEXT SESSION · 19:00</Badge>
        <h3 className="font-display mt-5 text-2xl font-bold">
          Master asynchronous JavaScript
        </h3>
        <p className="text-muted-foreground mt-3 leading-7">
          Complete one focused exercise and explain promises in your own words.
        </p>
        <div className="text-muted-foreground mt-6 flex gap-3 text-sm">
          <span className="flex items-center gap-1.5">
            <Clock3 className="size-4" />
            45 min
          </span>
          <span className="flex items-center gap-1.5">
            <Target className="size-4" />
            Milestone 2
          </span>
        </div>
      </div>
      <div className="border-primary-soft bg-surface grid size-32 place-items-center rounded-full border-[10px] text-center shadow-inner">
        <span>
          <strong className="font-display block text-3xl">45</strong>
          <small className="text-muted-foreground">minutes</small>
        </span>
      </div>
    </div>
  );
}

function ProgressPreview() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        {
          icon: BookOpenCheck,
          value: "62%",
          label: "Roadmap",
          tone: "bg-primary-soft text-primary-deep",
        },
        {
          icon: Clock3,
          value: "6.4h",
          label: "This week",
          tone: "bg-info-soft text-info-foreground",
        },
        {
          icon: Flame,
          value: "4/5",
          label: "Sessions",
          tone: "bg-accent-soft text-accent-foreground",
        },
      ].map(({ icon: Icon, value, label, tone }) => (
        <div
          key={label}
          className="border-border bg-background rounded-[22px] border p-5"
        >
          <span
            className={`mb-8 grid size-10 place-items-center rounded-2xl ${tone}`}
          >
            <Icon className="size-4.5" />
          </span>
          <strong className="font-display text-3xl">{value}</strong>
          <p className="text-muted-foreground mt-1 text-sm">{label}</p>
        </div>
      ))}
    </div>
  );
}

const panels: Record<Tab, React.ComponentType> = {
  Today: FocusPreview,
  Roadmap: RoadmapPreview,
  Calendar: WeeklyPreview,
  Progress: ProgressPreview,
};

export function ProductPreview() {
  const [active, setActive] = useState<Tab>("Today");
  const reduceMotion = useReducedMotion();
  const Panel = panels[active];

  return (
    <section id="preview" className="section-space">
      <div className="page-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-primary-strong mb-4 text-sm font-semibold">
            YOUR WHOLE LEARNING JOURNEY
          </p>
          <DisplayHeading>
            See your entire learning journey in one place.
          </DisplayHeading>
          <p className="text-muted-foreground mt-5 text-[17px] leading-8">
            A useful roadmap is connected to time, energy, and real progress—not
            hidden in another document.
          </p>
        </div>
        <div className="border-border bg-surface mx-auto mt-12 max-w-5xl overflow-hidden rounded-[32px] border shadow-[0_30px_90px_-55px_rgb(24_57_43/0.6)]">
          <div className="border-border flex items-center gap-2 border-b px-4 py-4 sm:px-6">
            <span className="bg-coral size-2.5 rounded-full" />
            <span className="bg-accent size-2.5 rounded-full" />
            <span className="bg-primary size-2.5 rounded-full" />
            <span className="text-muted-foreground ml-3 text-xs font-medium">
              Your learning workspace
            </span>
          </div>
          <div className="grid lg:grid-cols-[220px_1fr]">
            <div
              className="border-border flex gap-2 overflow-x-auto border-b p-4 lg:grid lg:border-r lg:border-b-0 lg:p-5"
              role="tablist"
              aria-label="Product preview"
            >
              {tabs.map((tab) => {
                const Icon =
                  tab === "Roadmap"
                    ? Target
                    : tab === "Calendar"
                      ? CalendarDays
                      : tab === "Today"
                        ? Circle
                        : BookOpenCheck;
                return (
                  <button
                    key={tab}
                    role="tab"
                    id={`preview-tab-${tab.toLowerCase()}`}
                    aria-controls={`preview-panel-${tab.toLowerCase()}`}
                    aria-selected={active === tab}
                    tabIndex={active === tab ? 0 : -1}
                    onClick={() => setActive(tab)}
                    onKeyDown={(event) => {
                      if (
                        event.key !== "ArrowRight" &&
                        event.key !== "ArrowLeft"
                      )
                        return;
                      event.preventDefault();
                      const current = tabs.indexOf(active);
                      const direction = event.key === "ArrowRight" ? 1 : -1;
                      const next =
                        tabs[
                          (current + direction + tabs.length) % tabs.length
                        ]!;
                      setActive(next);
                      requestAnimationFrame(() =>
                        document
                          .getElementById(`preview-tab-${next.toLowerCase()}`)
                          ?.focus(),
                      );
                    }}
                    className={cn(
                      "focus-visible:ring-ring/35 relative flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-3",
                      active === tab
                        ? "text-primary-deep"
                        : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                    )}
                  >
                    {active === tab ? (
                      <motion.span
                        layoutId="product-tab-indicator"
                        className="bg-primary-soft absolute inset-0 -z-10 rounded-2xl"
                        transition={motionTokens.spring.responsive}
                      />
                    ) : null}
                    <Icon className="size-4" aria-hidden="true" />
                    {tab}
                  </button>
                );
              })}
            </div>
            <div className="bg-surface-muted/50 min-h-[340px] p-5 sm:p-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  id={`preview-panel-${active.toLowerCase()}`}
                  role="tabpanel"
                  aria-labelledby={`preview-tab-${active.toLowerCase()}`}
                  variants={fadeScale}
                  initial={reduceMotion ? false : "hidden"}
                  animate="visible"
                  exit="hidden"
                >
                  <div className="mb-7 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold">
                        NODE.JS BACKEND
                      </p>
                      <h3 className="font-display mt-1 text-xl font-bold">
                        {active}
                      </h3>
                    </div>
                    <Badge tone="success">On track</Badge>
                  </div>
                  <Panel />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
