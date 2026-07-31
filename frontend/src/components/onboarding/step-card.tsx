import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type StepCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function StepCard({
  eyebrow,
  title,
  description,
  children,
  className,
}: StepCardProps) {
  return (
    <Card className={cn("mx-auto max-w-4xl p-5 sm:p-8 lg:p-10", className)}>
      <div className="mb-7 max-w-2xl">
        {eyebrow ? (
          <p className="text-primary-strong mb-2 text-xs font-bold tracking-[0.14em] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-foreground text-3xl leading-[1.08] font-bold tracking-[-0.035em] sm:text-4xl">
          {title}
        </h2>
        <p className="text-muted-foreground mt-3 text-sm leading-6 sm:text-base">
          {description}
        </p>
      </div>
      {children}
    </Card>
  );
}
