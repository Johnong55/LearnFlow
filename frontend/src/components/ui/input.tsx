"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string | undefined;
  error?: string | undefined;
  trailing?: React.ReactNode | undefined;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, description, error, trailing, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? `field-${generatedId.replaceAll(":", "")}`;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy =
      [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="space-y-2">
        <label
          htmlFor={inputId}
          className="text-foreground block text-sm font-semibold"
        >
          {label}
        </label>
        {description ? (
          <p
            id={descriptionId}
            className="text-muted-foreground text-xs leading-5"
          >
            {description}
          </p>
        ) : null}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              "border-border bg-surface text-foreground placeholder:text-muted-foreground/65 hover:border-primary/40 focus:border-primary focus:ring-primary/15 disabled:bg-surface-muted min-h-12 w-full rounded-2xl border px-4 text-[15px] shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-[border-color,box-shadow,background-color] outline-none focus:ring-3 disabled:cursor-not-allowed disabled:opacity-70",
              trailing && "pr-12",
              error && "border-danger focus:border-danger focus:ring-danger/15",
              className,
            )}
            {...props}
          />
          {trailing ? (
            <div className="absolute inset-y-0 right-2 flex items-center">
              {trailing}
            </div>
          ) : null}
        </div>
        {error ? (
          <p id={errorId} role="alert" className="text-danger text-sm">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
