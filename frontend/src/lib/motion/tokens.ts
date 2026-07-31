import type { Transition, Variants } from "framer-motion";

export const motionTokens = {
  duration: {
    instant: 0.12,
    fast: 0.2,
    normal: 0.35,
    slow: 0.55,
    cinematic: 1.1,
  },
  easing: {
    standard: [0.22, 1, 0.36, 1],
    enter: [0.16, 1, 0.3, 1],
    exit: [0.7, 0, 0.84, 0],
  },
  spring: {
    gentle: { type: "spring", stiffness: 180, damping: 24 },
    responsive: { type: "spring", stiffness: 320, damping: 30 },
  },
} as const;

export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 42 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.slow,
      ease: motionTokens.easing.enter,
    },
  },
};

export const lineDraw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: motionTokens.duration.cinematic,
      ease: motionTokens.easing.standard,
    },
  },
};

const normalTransition: Transition = {
  duration: motionTokens.duration.normal,
  ease: motionTokens.easing.standard,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: normalTransition },
  exit: { opacity: 0, transition: { duration: motionTokens.duration.fast } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: normalTransition },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: normalTransition },
};

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: motionTokens.spring.gentle },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: normalTransition },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: normalTransition },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

export const staggerItem = fadeUp;

export const modalMotion: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: motionTokens.spring.responsive,
  },
  exit: { opacity: 0, scale: 0.98, y: 5, transition: { duration: 0.16 } },
};

export const drawerMotion: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: motionTokens.spring.responsive },
  exit: {
    x: "100%",
    transition: { duration: 0.2, ease: motionTokens.easing.exit },
  },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: normalTransition },
};
