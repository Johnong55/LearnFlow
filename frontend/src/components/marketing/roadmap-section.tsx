"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Check,
  Clock3,
  Code2,
  Flag,
  Lock,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DisplayHeading } from "@/components/ui/display-heading";
import { lineDraw, motionTokens } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

const nodes = [
  {
    title: "JavaScript foundations",
    meta: "6 modules · 18 hours",
    status: "done",
    icon: Check,
  },
  {
    title: "Node.js fundamentals",
    meta: "Current · 4 of 7 tasks",
    status: "current",
    icon: Code2,
  },
  {
    title: "REST API development",
    meta: "5 modules · project included",
    status: "next",
    icon: BookOpen,
  },
  {
    title: "PostgreSQL + Prisma",
    meta: "4 modules · 12 hours",
    status: "locked",
    icon: Lock,
  },
  {
    title: "Production deployment",
    meta: "Final project · assessment",
    status: "locked",
    icon: Flag,
  },
] as const;

export function RoadmapSection() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="section-space relative overflow-hidden">
      <div className="page-shell grid items-center gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-primary-strong mb-4 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4" /> MORE THAN A CALENDAR
          </p>
          <DisplayHeading>
            Not just a schedule. A path from where you are to where you want to
            be.
          </DisplayHeading>
          <p className="text-muted-foreground mt-6 text-[17px] leading-8">
            SkillPilot searches useful learning paths, removes duplication,
            adapts the sequence to your level, and keeps the source trail
            attached.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Badge tone="primary">5 milestones</Badge>
            <Badge tone="blue">18 source references</Badge>
            <Badge tone="accent">
              <Clock3 className="mr-1 size-3" /> 16 weeks estimated
            </Badge>
          </div>
        </div>
        <div className="border-border bg-surface relative rounded-[34px] border p-5 shadow-[var(--shadow-soft)] sm:p-8">
          <svg
            aria-hidden="true"
            className="absolute top-20 bottom-20 left-[2.75rem] h-[calc(100%-10rem)] w-8 overflow-visible sm:left-[4.25rem]"
            viewBox="0 0 32 520"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M16 0 C4 70 28 110 16 180 S3 290 16 350 S28 450 16 520"
              fill="none"
              stroke="var(--border)"
              strokeWidth="3"
              strokeDasharray="7 8"
            />
            <motion.path
              d="M16 0 C4 70 28 110 16 180"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="4"
              strokeLinecap="round"
              variants={lineDraw}
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true }}
            />
          </svg>
          <div className="relative space-y-4">
            {nodes.map(({ title, meta, status, icon: Icon }, index) => (
              <motion.article
                key={title}
                initial={reduceMotion ? false : { opacity: 0, x: 28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{
                  delay: index * 0.08,
                  ...motionTokens.spring.gentle,
                }}
                className={cn(
                  "group relative ml-12 rounded-[24px] border p-5 transition-transform hover:translate-x-1 sm:ml-16",
                  status === "current"
                    ? "border-primary/40 bg-primary-soft shadow-[0_20px_50px_-36px_var(--primary)]"
                    : "border-border bg-background",
                )}
              >
                <span
                  className={cn(
                    "border-surface absolute top-1/2 -left-[4.15rem] z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border-4 sm:-left-[5.15rem]",
                    status === "done" && "bg-success text-white",
                    status === "current" &&
                      "bg-primary text-primary-foreground shadow-[0_0_0_7px_var(--primary-soft)]",
                    (status === "next" || status === "locked") &&
                      "bg-surface-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-bold">{title}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{meta}</p>
                  </div>
                  <Badge
                    tone={
                      status === "done"
                        ? "success"
                        : status === "current"
                          ? "primary"
                          : "neutral"
                    }
                  >
                    {status === "done"
                      ? "Completed"
                      : status === "current"
                        ? "In progress"
                        : status === "next"
                          ? "Up next"
                          : "Locked"}
                  </Badge>
                </div>
                {status === "current" ? (
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-[10px] font-bold">
                      <span>MODULE PROGRESS</span>
                      <span>58%</span>
                    </div>
                    <div className="bg-surface h-2 overflow-hidden rounded-full">
                      <motion.div
                        className="bg-primary h-full rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: "58%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <span className="bg-surface rounded-xl px-3 py-2 text-[10px] font-semibold">
                        Async patterns
                      </span>
                      <span className="bg-surface rounded-xl px-3 py-2 text-[10px] font-semibold">
                        Build one API route
                      </span>
                    </div>
                  </div>
                ) : null}
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
