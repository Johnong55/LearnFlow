"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BriefcaseBusiness,
  Coffee,
  Dumbbell,
  GraduationCap,
  Lock,
  Moon,
  Utensils,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DisplayHeading } from "@/components/ui/display-heading";
import { motionTokens } from "@/lib/motion/tokens";

const timeline = [
  {
    time: "00:00",
    end: "07:00",
    label: "Sleep",
    icon: Moon,
    tone: "bg-info-soft text-info-foreground",
    protected: true,
    span: "sm:col-span-2",
  },
  {
    time: "07:00",
    end: "08:00",
    label: "Morning routine",
    icon: Coffee,
    tone: "bg-accent-soft text-accent-foreground",
    protected: true,
    span: "",
  },
  {
    time: "09:00",
    end: "17:30",
    label: "Work",
    icon: BriefcaseBusiness,
    tone: "bg-surface-muted text-foreground",
    protected: true,
    span: "sm:col-span-3",
  },
  {
    time: "12:00",
    end: "13:00",
    label: "Lunch",
    icon: Utensils,
    tone: "bg-accent-soft text-accent-foreground",
    protected: true,
    span: "",
  },
  {
    time: "18:00",
    end: "19:00",
    label: "Exercise",
    icon: Dumbbell,
    tone: "bg-coral-soft text-coral-foreground",
    protected: true,
    span: "",
  },
  {
    time: "19:30",
    end: "20:15",
    label: "Node.js study",
    icon: GraduationCap,
    tone: "bg-primary text-primary-foreground",
    protected: false,
    span: "sm:col-span-2",
  },
  {
    time: "22:30",
    end: "24:00",
    label: "Wind down",
    icon: Moon,
    tone: "bg-info-soft text-info-foreground",
    protected: true,
    span: "",
  },
] as const;

export function BalanceSection() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="section-space bg-surface-muted/55 overflow-hidden">
      <div className="page-shell">
        <div className="grid gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="text-primary-strong mb-4 text-sm font-semibold">
              LIFE COMES FIRST
            </p>
            <DisplayHeading>
              Your work, sleep, meals, and rest come first.
            </DisplayHeading>
          </div>
          <p className="text-muted-foreground max-w-xl text-[17px] leading-8 lg:ml-auto">
            Hard constraints form the shape of your day. Learning only enters a
            slot after the essentials are protected—never by borrowing from
            sleep.
          </p>
        </div>
        <div className="border-border bg-surface relative mt-12 overflow-hidden rounded-[34px] border p-5 shadow-[var(--shadow-soft)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-xs font-semibold">
                A REAL THURSDAY · 24 HOURS
              </p>
              <p className="font-display mt-1 text-xl font-bold">
                Protected first. Learning fits second.
              </p>
            </div>
            <Badge tone="success">
              <Lock className="mr-1 size-3" /> Essentials protected
            </Badge>
          </div>
          <div className="text-muted-foreground mt-8 hidden grid-cols-7 gap-2 border-b pb-3 text-[10px] sm:grid">
            {["00", "04", "08", "12", "16", "20", "24"].map((time) => (
              <span key={time}>{time}:00</span>
            ))}
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-7">
            {timeline.map(
              (
                { time, end, label, icon: Icon, tone, protected: locked, span },
                index,
              ) => (
                <motion.div
                  key={`${time}-${label}`}
                  initial={
                    reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }
                  }
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.06,
                    ...motionTokens.spring.gentle,
                  }}
                  className={`${span} ${tone} relative min-h-24 rounded-[20px] p-4`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="size-4" />
                    {locked ? (
                      <Lock className="size-3 opacity-60" />
                    ) : (
                      <SparkDot />
                    )}
                  </div>
                  <p className="mt-5 text-sm font-bold">{label}</p>
                  <p className="mt-1 text-[10px] opacity-70">
                    {time}–{end}
                  </p>
                </motion.div>
              ),
            )}
          </div>
          <div className="bg-primary-soft text-primary-deep mt-6 flex items-start gap-3 rounded-2xl p-4 text-sm">
            <GraduationCap className="mt-0.5 size-4 shrink-0" />
            <p>
              <strong>Why 19:30?</strong> Work and exercise are finished, dinner
              has buffer time, energy is still medium-high, and sleep remains
              untouched.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SparkDot() {
  return (
    <span className="relative flex size-3">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-50" />
      <span className="relative inline-flex size-3 rounded-full bg-white" />
    </span>
  );
}
