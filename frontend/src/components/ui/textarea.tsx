"use client";

import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  description?: string | undefined;
  error?: string | undefined;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, label, description, error, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? `textarea-${generatedId.replaceAll(":", "")}`;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

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
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={
            [descriptionId, errorId].filter(Boolean).join(" ") || undefined
          }
          className={cn(
            "border-border bg-surface text-foreground placeholder:text-muted-foreground/65 hover:border-primary/40 focus:border-primary focus:ring-primary/15 min-h-28 w-full resize-y rounded-2xl border px-4 py-3 text-[15px] leading-6 shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-[border-color,box-shadow] outline-none focus:ring-3 disabled:cursor-not-allowed disabled:opacity-60",
            error && "border-danger focus:border-danger focus:ring-danger/15",
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} role="alert" className="text-danger text-sm">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
