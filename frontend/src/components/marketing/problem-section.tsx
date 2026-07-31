"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, Sparkles, X } from "lucide-react";

import { DisplayHeading } from "@/components/ui/display-heading";
import { motionTokens } from "@/lib/motion/tokens";

const generic = [
  "2 hours every day",
  "No work schedule",
  "No missed sessions",
  "No adjustment",
];
const skillPilot = [
  "Built around your availability",
  "Protects sleep and work",
  "Adjusts when life changes",
  "Tracks actual progress",
];

export function ProblemSection() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="section-space relative overflow-hidden">
      <div className="page-shell">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-coral mb-4 inline-flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4" /> THE OLD ASSUMPTION
          </p>
          <DisplayHeading>
            Most learning plans are built for imaginary people.
          </DisplayHeading>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-[17px] leading-8">
            Generic roadmaps assume unlimited time, perfect motivation, and no
            interruptions. Real life does not work that way.
          </p>
        </div>
        <div className="relative mx-auto mt-14 grid max-w-6xl gap-4 lg:grid-cols-2">
          <motion.article
            initial={reduceMotion ? false : { opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: motionTokens.easing.enter }}
            className="border-coral/20 bg-coral-soft/45 rounded-[32px] border p-6 sm:p-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-coral text-xs font-bold">GENERIC ROADMAP</p>
                <h3 className="font-display mt-2 text-2xl font-bold">
                  Looks productive. Breaks on contact.
                </h3>
              </div>
              <X className="text-coral size-7" />
            </div>
            <div className="mt-8 grid grid-cols-[3.5rem_1fr] gap-x-3 gap-y-2">
              {["08", "10", "12", "18", "22"].map((time, index) => (
                <div className="contents" key={time}>
                  <span className="text-muted-foreground pt-3 text-xs">
                    {time}:00
                  </span>
                  <motion.div
                    initial={
                      reduceMotion ? false : { scaleX: 0.75, opacity: 0 }
                    }
                    whileInView={{ scaleX: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.07 }}
                    className={`origin-left rounded-xl p-3 text-xs font-semibold ${index === 1 || index === 3 ? "bg-coral ring-coral/12 text-white ring-4" : "bg-surface text-muted-foreground"}`}
                  >
                    {index === 0
                      ? "Study"
                      : index === 1
                        ? "Study overlaps work"
                        : index === 2
                          ? "Study through lunch"
                          : index === 3
                            ? "Study + commute conflict"
                            : "Late-night review"}
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.article>
          <motion.article
            initial={reduceMotion ? false : { opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.12,
              duration: 0.55,
              ease: motionTokens.easing.enter,
            }}
            className="bg-primary-deep dark:bg-surface relative overflow-hidden rounded-[32px] p-6 text-white shadow-[0_35px_90px_-45px_rgb(24_57_43/0.8)] sm:p-8"
          >
            <div className="bg-primary/10 absolute -top-20 -right-16 size-52 rounded-full blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-primary text-xs font-bold">
                  SKILLPILOT PLAN
                </p>
                <h3 className="font-display mt-2 text-2xl font-bold">
                  Balanced around what is real.
                </h3>
              </div>
              <Sparkles className="text-primary size-7" />
            </div>
            <ul className="relative mt-8 space-y-3">
              {skillPilot.map((item) => (
                <li
                  key={item}
                  className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold"
                >
                  <span className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-full">
                    <Check className="size-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.article>
          <div className="border-border bg-surface absolute top-1/2 left-1/2 z-10 hidden size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border shadow-xl lg:grid">
            <span className="text-primary-strong text-xl">→</span>
          </div>
        </div>
        <div className="mx-auto mt-6 grid max-w-6xl gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {generic.map((item, index) => (
            <div
              key={item}
              className="text-muted-foreground flex items-center gap-2 px-2 text-xs"
            >
              <span className="font-display text-coral text-lg">
                0{index + 1}
              </span>
              <span>
                {item} → {skillPilot[index]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
