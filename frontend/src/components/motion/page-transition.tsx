"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { pageTransition } from "@/lib/motion/tokens";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (pathname.startsWith("/onboarding")) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        {...(reduceMotion ? {} : { exit: "hidden" })}
        variants={pageTransition}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
