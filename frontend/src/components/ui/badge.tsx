import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeTone =
  "primary" | "accent" | "blue" | "coral" | "neutral" | "success";

const tones: Record<BadgeTone, string> = {
  primary: "bg-primary-soft text-primary-deep",
  accent: "bg-accent-soft text-accent-foreground",
  blue: "bg-info-soft text-info-foreground",
  coral: "bg-coral-soft text-coral-foreground",
  neutral: "bg-surface-muted text-muted-foreground",
  success: "bg-success-soft text-success-foreground",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
