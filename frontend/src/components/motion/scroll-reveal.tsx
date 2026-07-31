"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { motionTokens } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  direction?: "up" | "left" | "right";
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  distance = 28,
  direction = "up",
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();
  const offset =
    direction === "left"
      ? { x: distance, y: 0 }
      : direction === "right"
        ? { x: -distance, y: 0 }
        : { x: 0, y: distance };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -8% 0px" }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: motionTokens.duration.slow,
              delay,
              ease: motionTokens.easing.enter,
            }
      }
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
