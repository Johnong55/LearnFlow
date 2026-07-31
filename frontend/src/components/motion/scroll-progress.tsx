"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reduceMotion = useReducedMotion();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: reduceMotion ? 1000 : 180,
    damping: reduceMotion ? 100 : 28,
    mass: 0.25,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="from-primary via-accent to-info fixed inset-x-0 top-0 z-[70] h-1 origin-left bg-gradient-to-r"
      style={{ scaleX }}
    />
  );
}
