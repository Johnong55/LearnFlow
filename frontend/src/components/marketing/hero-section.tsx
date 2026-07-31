"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { HeroVisual } from "@/components/marketing/hero-visual";
import { Button } from "@/components/ui/button";
import {
  motionTokens,
  staggerContainer,
  staggerItem,
} from "@/lib/motion/tokens";

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-[min(960px,100svh)] overflow-hidden pt-28 pb-20 sm:pt-36 lg:flex lg:min-h-[900px] lg:items-center lg:pt-28 lg:pb-24">
      <div className="hero-aurora pointer-events-none absolute inset-0" />
      <div className="grid-dots pointer-events-none absolute inset-x-0 top-0 h-[700px] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-40" />
      <div className="pointer-events-none absolute top-[14%] left-[48%] size-[32rem] rounded-full bg-[radial-gradient(circle,var(--primary-soft),transparent_68%)] opacity-70" />
      <motion.div
        variants={staggerContainer}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        className="page-shell relative grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-4"
      >
        <div className="relative z-10 max-w-4xl">
          <motion.div
            variants={staggerItem}
            className="mb-7 flex items-center gap-3"
          >
            <span className="bg-primary-deep text-primary grid size-9 place-items-center rounded-2xl shadow-lg">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <span className="text-muted-foreground text-sm font-semibold">
              AI roadmap · planned around your real life
            </span>
          </motion.div>
          <h1 className="font-display text-[clamp(3.2rem,6.35vw,6.85rem)] leading-[0.91] font-bold tracking-[-0.058em] text-balance">
            <motion.span
              variants={staggerItem}
              className="block overflow-hidden pb-[0.08em]"
            >
              Turn the{" "}
              <span className="text-primary-strong">skills you want</span>
            </motion.span>
            <motion.span
              variants={staggerItem}
              className="block overflow-hidden pb-[0.08em]"
            >
              into a plan you can
            </motion.span>
            <motion.span
              variants={staggerItem}
              className="block overflow-hidden pb-[0.08em]"
            >
              <span className="relative inline-block">
                actually follow.
                <motion.span
                  aria-hidden="true"
                  className="bg-accent absolute right-0 -bottom-1 left-0 -z-10 h-[0.18em] rounded-full"
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    delay: 0.65,
                    duration: 0.7,
                    ease: motionTokens.easing.enter,
                  }}
                  style={{ transformOrigin: "left" }}
                />
              </span>
            </motion.span>
          </h1>
          <motion.p
            variants={staggerItem}
            className="text-muted-foreground mt-7 max-w-2xl text-[17px] leading-8 sm:text-xl sm:leading-9"
          >
            SkillPilot creates a personalized learning roadmap and fits it
            around your work, sleep, routines, and real life.
          </motion.p>
          <motion.div
            variants={staggerItem}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="group landing-cta sm:min-w-52">
              <Link href="/sign-up">
                Build my roadmap
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/#how-it-works">
                <PlayCircle className="size-4" aria-hidden="true" />
                See how it works
              </Link>
            </Button>
          </motion.div>
          <motion.p
            variants={staggerItem}
            className="text-muted-foreground mt-6 flex items-center gap-2 text-sm"
          >
            <ShieldCheck className="text-success size-4" aria-hidden="true" />
            No perfect schedule required. Start with your real life.
          </motion.p>
        </div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.94, x: 34 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{
            delay: reduceMotion ? 0 : 0.35,
            ...motionTokens.spring.gentle,
          }}
        >
          <HeroVisual />
        </motion.div>
      </motion.div>
      <div className="page-shell text-muted-foreground/65 pointer-events-none absolute right-0 bottom-5 left-0 hidden items-center justify-between text-[11px] font-semibold tracking-[0.15em] uppercase lg:flex">
        <span>Goal → roadmap → balanced week</span>
        <span>Scroll to explore ↓</span>
      </div>
    </section>
  );
}
