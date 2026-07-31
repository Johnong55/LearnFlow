"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  Moon,
  Sparkles,
  Utensils,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { lineDraw } from "@/lib/motion/tokens";

export function FinalCta() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-16">
      <div className="bg-primary-deep dark:bg-surface relative mx-auto max-w-7xl overflow-hidden rounded-[38px] px-6 py-20 text-center text-white shadow-[0_35px_100px_-45px_rgb(24_57_43/0.85)] sm:px-10 sm:py-28">
        <div className="bg-primary/18 absolute -top-32 -left-16 size-96 rounded-full blur-3xl" />
        <div className="bg-info/12 absolute -right-24 -bottom-36 size-[28rem] rounded-full blur-3xl" />
        <div className="grid-dots absolute inset-0 opacity-[0.08]" />
        <svg
          aria-hidden="true"
          className="absolute inset-x-0 bottom-5 h-32 w-full opacity-45"
          viewBox="0 0 1200 130"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0 100 C220 20 340 120 520 66 S820 30 1200 78"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeDasharray="8 10"
            variants={lineDraw}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true }}
          />
        </svg>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <Sparkles className="text-primary mx-auto mb-7 size-8" />
          <h2 className="font-display mx-auto max-w-5xl text-[clamp(2.8rem,6vw,6.4rem)] leading-[0.94] font-bold tracking-[-0.055em] text-balance">
            Your goal deserves more than a to-do list.
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-8 text-white/68">
            Build a learning roadmap that fits the life you already have.
          </p>
          <Button asChild size="lg" className="landing-cta group mt-9 min-w-48">
            <Link href="/sign-up">
              Create my plan{" "}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <p className="mt-5 text-xs text-white/45">
            Start with your goal. Adjust everything later.
          </p>
        </motion.div>
        <FloatingTag
          reduced={Boolean(reduceMotion)}
          className="top-10 left-[8%]"
          icon={Moon}
          label="Sleep protected"
        />
        <FloatingTag
          reduced={Boolean(reduceMotion)}
          className="top-[28%] right-[5%]"
          icon={BriefcaseBusiness}
          label="Work respected"
        />
        <FloatingTag
          reduced={Boolean(reduceMotion)}
          className="bottom-10 left-[16%]"
          icon={Utensils}
          label="Life included"
        />
      </div>
    </section>
  );
}

function FloatingTag({
  reduced,
  className,
  icon: Icon,
  label,
}: {
  reduced: boolean;
  className: string;
  icon: typeof Moon;
  label: string;
}) {
  return (
    <motion.span
      aria-hidden="true"
      animate={reduced ? false : { y: [0, -5, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      className={`absolute hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-semibold text-white/65 backdrop-blur-sm lg:flex ${className}`}
    >
      <Icon className="text-primary size-3.5" />
      {label}
    </motion.span>
  );
}
