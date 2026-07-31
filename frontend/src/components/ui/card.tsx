import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-border bg-surface rounded-[28px] border p-6 shadow-[0_20px_60px_-42px_rgb(24_57_43/0.45)]",
        className,
      )}
      {...props}
    />
  );
}
