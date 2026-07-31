import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function DisplayHeading({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-display text-foreground text-3xl leading-[1.05] font-bold tracking-[-0.035em] text-balance sm:text-4xl lg:text-5xl",
        className,
      )}
      {...props}
    />
  );
}
