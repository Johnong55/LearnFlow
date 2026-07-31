"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarRange, Check, Goal, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";

import { DisplayHeading } from "@/components/ui/display-heading";
import { motionTokens } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

const steps = [
  {
    icon: Goal,
    title: "Tell us what you want to learn",
    text: "Choose any skill, your current level, and what success looks like.",
    visual: "goal",
  },
  {
    icon: CalendarRange,
    title: "Add your work and life routine",
    text: "Protect work, sleep, meals, exercise, family, and personal time.",
    visual: "routine",
  },
  {
    icon: Sparkles,
    title: "Let AI build your roadmap",
    text: "Useful sources become milestones and practical tasks tailored to your level.",
    visual: "roadmap",
  },
  {
    icon: RefreshCw,
    title: "Follow a schedule that adapts",
    text: "Miss a session and the plan finds a realistic new slot without overloading tomorrow.",
    visual: "adapt",
  },
] as const;

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  return (
    <section
      id="how-it-works"
      className="section-space bg-primary-deep dark:bg-surface relative overflow-hidden text-white"
    >
      <div className="grid-dots pointer-events-none absolute inset-0 opacity-[0.08]" />
      <div className="page-shell relative">
        <div className="max-w-3xl">
          <p className="text-primary mb-4 text-sm font-semibold">
            FROM GOAL TO DAILY ACTION
          </p>
          <DisplayHeading className="text-white">
            Four moments. One plan that stays connected.
          </DisplayHeading>
        </div>
        <div className="mt-14 grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <ol className="relative space-y-3">
            <div className="absolute top-6 bottom-6 left-6 w-px bg-white/10" />
            <motion.div
              className="bg-primary absolute top-6 left-6 w-px origin-top"
              animate={{ height: `${(active / 3) * 88}%` }}
              transition={motionTokens.spring.gentle}
            />
            {steps.map(({ icon: Icon, title, text, visual }, index) => (
              <motion.li
                key={title}
                onViewportEnter={() => setActive(index)}
                viewport={{ margin: "-38% 0px -38% 0px" }}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  className={cn(
                    "focus-visible:ring-primary/40 relative w-full rounded-[24px] border p-5 text-left transition-colors outline-none focus-visible:ring-3",
                    active === index
                      ? "border-white/14 bg-white/[0.08]"
                      : "border-transparent text-white/55 hover:text-white",
                  )}
                >
                  <div className="flex gap-4">
                    <span
                      className={cn(
                        "relative z-10 grid size-12 shrink-0 place-items-center rounded-[18px] transition-colors",
                        active === index
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary-deep dark:bg-surface border border-white/15 text-white/55",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <span className="font-display text-primary/75 text-sm">
                        0{index + 1}
                      </span>
                      <h3 className="font-display mt-1 text-xl font-bold text-white">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/60">
                        {text}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 lg:hidden">
                    <StepVisual type={visual} compact />
                  </div>
                </button>
              </motion.li>
            ))}
          </ol>
          <div className="sticky top-28 hidden h-[34rem] self-start lg:block">
            <motion.div
              layout
              className="h-full rounded-[34px] border border-white/12 bg-white/[0.055] p-7 shadow-2xl backdrop-blur-sm"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="text-xs font-semibold text-white/50">
                  SKILLPILOT · STEP 0{active + 1}
                </span>
                <span className="flex gap-1">
                  {steps.map((step, index) => (
                    <i
                      key={step.title}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        active === index
                          ? "bg-primary w-7"
                          : "w-1.5 bg-white/18",
                      )}
                    />
                  ))}
                </span>
              </div>
              <motion.div
                key={active}
                initial={
                  reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={motionTokens.spring.gentle}
                className="h-[calc(100%-3rem)]"
              >
                <StepVisual type={steps[active]!.visual} />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepVisual({
  type,
  compact = false,
}: {
  type: (typeof steps)[number]["visual"];
  compact?: boolean;
}) {
  const shell = compact ? "min-h-36" : "h-full";
  if (type === "goal")
    return (
      <div className={`${shell} grid place-items-center`}>
        <div className="text-foreground w-full max-w-md rounded-[26px] bg-white p-6 shadow-xl">
          <span className="bg-accent-soft text-accent-foreground rounded-full px-3 py-1 text-[10px] font-bold">
            YOUR GOAL
          </span>
          <h4 className="font-display mt-5 text-2xl font-bold">
            Build and deploy a Node.js API
          </h4>
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
            <span className="bg-surface-muted rounded-xl p-3">
              Beginner now
            </span>
            <span className="bg-primary-soft text-primary-deep rounded-xl p-3">
              Production ready
            </span>
          </div>
        </div>
      </div>
    );
  if (type === "routine")
    return (
      <div className={`${shell} grid content-center gap-2`}>
        {[
          ["Sleep", "bg-info-soft text-info-foreground", "00–07"],
          ["Work", "bg-white/10 text-white", "09–17"],
          ["Exercise", "bg-coral-soft text-coral-foreground", "18–19"],
          ["Open slot", "bg-primary text-primary-foreground", "19–20"],
        ].map(([label, tone, time]) => (
          <div
            key={label}
            className="grid grid-cols-[4rem_1fr] items-center gap-3"
          >
            <span className="text-xs text-white/45">{time}</span>
            <span className={`rounded-2xl p-4 text-sm font-semibold ${tone}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  if (type === "roadmap")
    return (
      <div className={`${shell} flex items-center justify-center`}>
        <div className="relative w-full max-w-md space-y-3">
          {[
            "Foundations",
            "Build APIs",
            "Database design",
            "Deploy project",
          ].map((item, index) => (
            <div
              key={item}
              className="relative z-10 flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.07] p-4"
            >
              <span
                className={`grid size-9 place-items-center rounded-full text-xs font-bold ${index === 0 ? "bg-success" : index === 1 ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/45"}`}
              >
                {index === 0 ? <Check className="size-4" /> : index + 1}
              </span>
              <span className="font-semibold">{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  return (
    <div className={`${shell} grid place-items-center`}>
      <div className="text-foreground w-full max-w-md rounded-[26px] bg-white p-5 shadow-xl">
        <div className="grid grid-cols-4 gap-2">
          {["Wed", "Thu", "Fri", "Sat"].map((day, index) => (
            <div key={day}>
              <p className="text-muted-foreground mb-2 text-center text-xs">
                {day}
              </p>
              <div className="bg-info-soft h-16 rounded-xl" />
              {index === 0 ? (
                <div className="bg-coral-soft text-coral mt-2 grid h-11 place-items-center rounded-xl text-[9px] font-bold line-through">
                  Missed
                </div>
              ) : index === 3 ? (
                <div className="bg-primary-soft text-primary-deep mt-2 grid h-11 place-items-center rounded-xl text-[9px] font-bold">
                  Study 09:00
                </div>
              ) : (
                <div className="bg-surface-muted mt-2 h-11 rounded-xl" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
