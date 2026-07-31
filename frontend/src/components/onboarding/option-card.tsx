import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type OptionCardProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
};

export function OptionCard({
  title,
  description,
  icon: Icon,
  selected,
  onClick,
  compact,
}: OptionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "border-border bg-surface focus-visible:ring-ring/35 group hover:border-primary/45 w-full rounded-[22px] border p-4 text-left transition-[transform,border-color,background-color,box-shadow] outline-none hover:-translate-y-0.5 focus-visible:ring-3",
        selected &&
          "border-primary bg-primary-soft shadow-[0_16px_35px_-27px_var(--primary)]",
        compact && "p-3.5",
      )}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <span
            className={cn(
              "bg-surface-muted text-muted-foreground grid size-10 shrink-0 place-items-center rounded-xl",
              selected && "bg-primary text-primary-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
        ) : null}
        <span>
          <span className="text-foreground block font-semibold">{title}</span>
          {description ? (
            <span className="text-muted-foreground mt-1 block text-xs leading-5">
              {description}
            </span>
          ) : null}
        </span>
      </div>
    </button>
  );
}
