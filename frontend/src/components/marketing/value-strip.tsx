"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BatteryCharging,
  BriefcaseBusiness,
  Check,
  HeartPulse,
  Moon,
  RefreshCw,
  Route,
} from "lucide-react";

import { DisplayHeading } from "@/components/ui/display-heading";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";

const values = [
  {
    icon: Route,
    title: "Personalized learning path",
    text: "Topics rearrange around your current level, outcome, and deadline.",
    tone: "bg-primary-soft text-primary-deep",
    visual: "path",
  },
  {
    icon: HeartPulse,
    title: "Life-aware scheduling",
    text: "Study fits between work, sleep, meals, exercise, and personal time.",
    tone: "bg-info-soft text-info-foreground",
    visual: "schedule",
  },
  {
    icon: RefreshCw,
    title: "Automatic replanning",
    text: "A missed session becomes new scheduling information, not failure.",
    tone: "bg-coral-soft text-coral-foreground",
    visual: "replan",
  },
  {
    icon: BatteryCharging,
    title: "Healthy workload",
    text: "Daily capacity and recovery time keep progress sustainable.",
    tone: "bg-accent-soft text-accent-foreground",
    visual: "capacity",
  },
] as const;

export function ValueStrip() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="features"
      className="section-space border-border/70 bg-surface/55 relative overflow-hidden border-y"
    >
      <div className="page-shell">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-primary-strong mb-4 text-sm font-semibold">
              A PLAN THAT SEES THE WHOLE PICTURE
            </p>
            <DisplayHeading>
              A roadmap should understand your life, not compete with it.
            </DisplayHeading>
          </div>
          <p className="text-muted-foreground max-w-xl text-[17px] leading-8 lg:ml-auto">
            SkillPilot connects what to learn with when learning is genuinely
            possible—then keeps both sides in sync as life changes.
          </p>
        </div>
        <motion.div
          variants={staggerContainer}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.18 }}
          className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {values.map(({ icon: Icon, title, text, tone, visual }, index) => (
            <motion.article
              key={title}
              variants={staggerItem}
              className="group border-border bg-background relative min-h-[330px] overflow-hidden rounded-[30px] border p-6 shadow-[0_24px_70px_-48px_rgb(24_57_43/0.55)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`grid size-12 place-items-center rounded-[18px] ${tone}`}
                >
                  <Icon className="size-5" />
                </span>
                <span className="font-display text-muted-foreground/15 text-4xl font-bold">
                  0{index + 1}
                </span>
              </div>
              <MiniVisual type={visual} />
              <h3 className="font-display mt-6 text-xl font-bold">{title}</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                {text}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function MiniVisual({ type }: { type: (typeof values)[number]["visual"] }) {
  if (type === "path")
    return (
      <div className="mt-8 flex items-center gap-2" aria-hidden="true">
        {[Check, Route, Route].map((Icon, index) => (
          <span
            key={index}
            className={`grid size-9 place-items-center rounded-full ${index === 0 ? "bg-success text-white" : index === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground border border-dashed"}`}
          >
            <Icon className="size-3.5" />
          </span>
        ))}
      </div>
    );
  if (type === "schedule")
    return (
      <div className="mt-8 grid grid-cols-3 gap-2" aria-hidden="true">
        <span className="bg-info-soft text-info grid h-14 place-items-center rounded-xl">
          <BriefcaseBusiness className="size-4" />
        </span>
        <span className="bg-primary-soft text-primary grid h-14 place-items-center rounded-xl">
          <Route className="size-4" />
        </span>
        <span className="bg-coral-soft text-coral grid h-14 place-items-center rounded-xl">
          <Moon className="size-4" />
        </span>
      </div>
    );
  if (type === "replan")
    return (
      <div className="mt-8 flex items-center gap-2" aria-hidden="true">
        <span className="bg-coral-soft border-coral/20 h-12 flex-1 rounded-xl border line-through" />
        <RefreshCw className="text-primary size-4" />
        <span className="bg-primary-soft border-primary/25 h-12 flex-1 rounded-xl border" />
      </div>
    );
  return (
    <div className="mt-10" aria-hidden="true">
      <div className="mb-2 flex justify-between text-[10px] font-bold">
        <span>Daily energy</span>
        <span>72%</span>
      </div>
      <div className="bg-muted h-3 overflow-hidden rounded-full">
        <motion.div
          className="bg-accent h-full rounded-full"
          initial={{ width: 0 }}
          whileInView={{ width: "72%" }}
          viewport={{ once: true }}
        />
      </div>
    </div>
  );
}
