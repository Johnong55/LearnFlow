"use client";

import type { DayOfWeek } from "@/features/onboarding/types";
import { WEEKDAYS, WEEKDAY_LABELS } from "@/features/onboarding/types";
import { cn } from "@/lib/utils/cn";

type WeekdaySelectorProps = {
  value: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
  label?: string;
};

export function WeekdaySelector({
  value,
  onChange,
  label = "Chọn ngày",
}: WeekdaySelectorProps) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{label}</legend>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((day) => {
          const selected = value.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onChange(
                  selected
                    ? value.filter((item) => item !== day)
                    : [...value, day],
                )
              }
              className={cn(
                "border-border bg-surface focus-visible:ring-ring/35 hover:border-primary/50 grid min-h-11 place-items-center rounded-xl border text-xs font-bold transition-[transform,background-color,border-color] outline-none hover:-translate-y-0.5 focus-visible:ring-3 sm:min-h-12 sm:text-sm",
                selected &&
                  "border-primary bg-primary text-primary-foreground shadow-[0_8px_22px_-14px_var(--primary)]",
              )}
            >
              {WEEKDAY_LABELS[day]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
