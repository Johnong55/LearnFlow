"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef, useId, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  description?: string | undefined;
  error?: string | undefined;
  options: Array<{ value: string; label: string }>;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ id, label, description, error, options, className, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? `select-${generatedId.replaceAll(":", "")}`;
    return (
      <div className="space-y-2">
        <label
          htmlFor={selectId}
          className="text-foreground block text-sm font-semibold"
        >
          {label}
        </label>
        {description ? (
          <p className="text-muted-foreground text-xs leading-5">
            {description}
          </p>
        ) : null}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            className={cn(
              "border-border bg-surface text-foreground hover:border-primary/40 focus:border-primary focus:ring-primary/15 min-h-12 w-full appearance-none rounded-2xl border px-4 pr-11 text-[15px] transition-[border-color,box-shadow] outline-none focus:ring-3 disabled:opacity-60",
              error && "border-danger",
              className,
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
        </div>
        {error ? (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

SelectField.displayName = "SelectField";
