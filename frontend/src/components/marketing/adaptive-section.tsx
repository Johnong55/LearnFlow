"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarX2,
  Check,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/ui/display-heading";
import { motionTokens } from "@/lib/motion/tokens";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AdaptiveSection() {
  const [moved, setMoved] = useState(false);
  const reduceMotion = useReducedMotion();
  return (
    <section className="section-space bg-primary-deep dark:bg-surface relative overflow-hidden text-white">
      <div className="bg-coral/8 pointer-events-none absolute -top-32 right-0 size-96 rounded-full blur-3xl" />
      <div className="page-shell relative grid items-center gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
        <div>
          <p className="text-primary mb-4 flex items-center gap-2 text-sm font-semibold">
            <RefreshCw className="size-4" /> ADAPTIVE, NOT PUNITIVE
          </p>
          <DisplayHeading className="text-white">
            Miss a session. Keep the momentum.
          </DisplayHeading>
          <p className="mt-6 text-[17px] leading-8 text-white/65">
            A missed session returns to the scheduling queue. Dependencies stay
            intact, tomorrow stays reasonable, and your estimate updates
            honestly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => setMoved(true)} disabled={moved}>
              <CalendarX2 className="size-4" /> Miss Wednesday session
            </Button>
            {moved ? (
              <Button
                variant="secondary"
                onClick={() => setMoved(false)}
                className="border-white/15 bg-white/8 text-white hover:bg-white/12"
              >
                <RotateCcw className="size-4" /> Reset demo
              </Button>
            ) : null}
          </div>
        </div>
        <div className="rounded-[32px] border border-white/12 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-sm sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white/45">
                ADAPTIVE WEEK
              </p>
              <p className="font-display mt-1 text-xl font-bold">
                One task, a better slot
              </p>
            </div>
            <span className="bg-primary/15 text-primary rounded-full px-3 py-1.5 text-xs font-bold">
              {moved ? "Rescheduled" : "On track"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {days.map((day, index) => {
              const isWednesday = index === 2;
              const isFriday = index === 4;
              const isSaturday = index === 5;
              return (
                <div key={day} className="min-w-0">
                  <p className="mb-3 text-center text-xs font-semibold text-white/50">
                    {day}
                  </p>
                  <div className="bg-info/15 text-info h-16 rounded-xl p-2 text-[9px] font-semibold">
                    Work
                  </div>
                  <div className="bg-accent/12 text-accent mt-2 h-8 rounded-xl p-2 text-[8px]">
                    Life
                  </div>
                  <div className="relative mt-2 h-14 rounded-xl border border-dashed border-white/10 bg-white/[0.035]">
                    <AnimatePresence initial={false}>
                      {isWednesday && !moved ? (
                        <motion.div
                          layoutId="adaptive-study"
                          className="bg-primary text-primary-foreground absolute inset-0 grid place-items-center rounded-xl text-[9px] font-bold"
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : motionTokens.spring.gentle
                          }
                        >
                          Node.js
                        </motion.div>
                      ) : null}
                      {isWednesday && moved ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-coral/18 text-coral absolute inset-0 grid place-items-center rounded-xl text-[9px] font-bold line-through"
                        >
                          Missed
                        </motion.div>
                      ) : null}
                      {isFriday && moved ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-coral/25 bg-coral/12 text-coral absolute inset-0 grid place-items-center rounded-xl border px-1 text-center text-[8px] font-bold"
                        >
                          Overloaded
                        </motion.div>
                      ) : null}
                      {isSaturday && moved ? (
                        <motion.div
                          layoutId="adaptive-study"
                          className="bg-primary text-primary-foreground absolute inset-0 grid place-items-center rounded-xl text-[9px] font-bold"
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : motionTokens.spring.gentle
                          }
                        >
                          Node.js · 09:00
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={moved ? "moved" : "ready"}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-5 flex items-start gap-3 rounded-2xl p-4 text-sm ${moved ? "bg-primary/14 text-primary" : "bg-white/[0.05] text-white/55"}`}
              aria-live="polite"
            >
              {moved ? (
                <Check className="mt-0.5 size-4 shrink-0" />
              ) : (
                <Sparkles className="mt-0.5 size-4 shrink-0" />
              )}
              <p>
                {moved
                  ? "Saturday morning was selected. Friday remained protected from overload, and the completion estimate stays on track."
                  : "Try the demo to see SkillPilot check availability, reject an overloaded day, and move the task."}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
