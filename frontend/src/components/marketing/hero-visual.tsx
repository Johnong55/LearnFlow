"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  BriefcaseBusiness,
  Check,
  Code2,
  Coffee,
  Dumbbell,
  Moon,
  Route,
  Sparkles,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { motionTokens } from "@/lib/motion/tokens";

const milestones = [
  "JavaScript foundations",
  "Node.js fundamentals",
  "REST API development",
  "PostgreSQL + Prisma",
  "Deployment project",
];

const week = [
  { day: "Mon", study: "19:00" },
  { day: "Tue", study: null },
  { day: "Wed", study: "19:30" },
  { day: "Thu", study: null },
  { day: "Fri", study: "18:30" },
];

export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto min-h-[600px] w-full max-w-[620px] sm:min-h-[650px] lg:mr-[-3rem]">
      <div className="bg-primary/18 pointer-events-none absolute top-24 right-12 size-72 rounded-full blur-3xl" />
      <div className="bg-info/14 pointer-events-none absolute bottom-20 left-8 size-64 rounded-full blur-3xl" />

      <motion.article
        initial={reduceMotion ? false : { opacity: 0, y: 22, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: -1.5 }}
        transition={{ delay: 0.48, ...motionTokens.spring.gentle }}
        className="border-border bg-surface absolute top-0 left-0 z-30 w-[min(88%,25rem)] rounded-[26px] border p-5 shadow-[0_30px_75px_-38px_rgb(24_57_43/0.55)] sm:left-4"
      >
        <div className="flex items-center justify-between gap-3">
          <Badge tone="accent">GOAL</Badge>
          <Target className="text-coral size-5" aria-hidden="true" />
        </div>
        <h2 className="font-display mt-4 text-xl leading-tight font-bold">
          Become a Node.js backend developer
        </h2>
        <div className="text-muted-foreground mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <span>Current · Beginner</span>
          <span>Target · Deploy an API</span>
        </div>
      </motion.article>

      <motion.div
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{
          delay: 0.7,
          duration: 0.45,
          ease: motionTokens.easing.enter,
        }}
        className="text-primary-strong absolute top-[154px] left-20 z-20 grid h-14 origin-top place-items-center sm:left-28"
      >
        <span className="bg-primary h-10 w-px" />
        <ArrowDown className="size-4" />
      </motion.div>

      <motion.article
        initial={reduceMotion ? false : { opacity: 0, x: 35, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 0.76, ...motionTokens.spring.gentle }}
        className="border-border bg-primary-deep dark:bg-surface absolute top-[205px] right-0 z-20 w-[min(91%,28rem)] rounded-[30px] border border-white/10 p-5 text-white shadow-[0_38px_95px_-42px_rgb(24_57_43/0.85)] sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary text-[10px] font-bold tracking-[0.15em]">
              PERSONALIZED ROADMAP
            </p>
            <h2 className="font-display mt-1 text-xl font-bold">
              Your path to production
            </h2>
          </div>
          <span className="bg-primary/18 text-primary grid size-11 place-items-center rounded-2xl">
            <Route className="size-5" />
          </span>
        </div>
        <ol className="mt-5 space-y-2.5">
          {milestones.map((milestone, index) => (
            <motion.li
              key={milestone}
              initial={reduceMotion ? false : { opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.93 + index * 0.07, duration: 0.35 }}
              className="flex items-center gap-3"
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${index === 0 ? "bg-primary text-primary-foreground" : index === 1 ? "border-primary bg-primary/15 text-primary border" : "border border-white/14 text-white/45"}`}
              >
                {index === 0 ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span
                className={`text-xs font-semibold ${index > 1 ? "text-white/52" : "text-white"}`}
              >
                {milestone}
              </span>
              {index === 1 ? (
                <span className="bg-primary ml-auto size-2 animate-pulse rounded-full" />
              ) : null}
            </motion.li>
          ))}
        </ol>
      </motion.article>

      <motion.article
        initial={reduceMotion ? false : { opacity: 0, y: 38, rotate: 2 }}
        animate={{ opacity: 1, y: 0, rotate: 1 }}
        transition={{ delay: 1.05, ...motionTokens.spring.gentle }}
        className="border-border bg-surface absolute right-2 bottom-0 z-30 w-[min(96%,31rem)] rounded-[28px] border p-4 shadow-[0_36px_90px_-42px_rgb(24_57_43/0.65)] sm:right-7 sm:p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-bold tracking-[0.12em]">
              WEEKLY SCHEDULE
            </p>
            <p className="mt-1 text-sm font-bold">
              Learning found three valid slots
            </p>
          </div>
          <Badge tone="success">
            <Sparkles className="mr-1 size-3" /> Balanced
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {week.map(({ day, study }) => (
            <div key={day} className="min-w-0">
              <p className="text-muted-foreground mb-2 text-center text-[9px] font-bold">
                {day}
              </p>
              <div className="bg-info-soft text-info-foreground flex h-10 items-center justify-center rounded-lg">
                <BriefcaseBusiness className="size-3" />
              </div>
              <div className="bg-accent-soft text-accent-foreground mt-1 flex h-5 items-center justify-center rounded-md">
                <Coffee className="size-2.5" />
              </div>
              {study ? (
                <motion.div
                  layoutId={`hero-study-${day}`}
                  className="bg-primary-soft text-primary-deep border-primary/25 mt-1 flex h-9 flex-col items-center justify-center rounded-lg border text-[8px] font-bold"
                >
                  <Code2 className="size-2.5" />
                  {study}
                </motion.div>
              ) : (
                <div className="bg-surface-muted mt-1 h-9 rounded-lg" />
              )}
            </div>
          ))}
        </div>
        <div className="text-muted-foreground mt-3 flex items-center justify-between text-[9px] font-semibold">
          <span className="flex items-center gap-1">
            <Moon className="text-info size-3" /> Sleep protected
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell className="text-coral size-3" /> Exercise protected
          </span>
        </div>
      </motion.article>
    </div>
  );
}
