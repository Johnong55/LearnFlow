import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 text-sm font-semibold transition-[transform,background-color,color,border-color,box-shadow] duration-200 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[0_10px_30px_-12px_var(--primary)] hover:-translate-y-0.5 hover:bg-primary-strong hover:shadow-[0_14px_34px_-14px_var(--primary)]",
        secondary:
          "border border-border bg-surface text-foreground shadow-sm hover:-translate-y-0.5 hover:border-primary/35 hover:bg-surface-muted",
        ghost: "text-foreground hover:bg-surface-muted",
        danger: "bg-danger text-white hover:bg-danger/90",
      },
      size: {
        sm: "min-h-9 rounded-xl px-3.5 text-xs",
        md: "min-h-11 px-5",
        lg: "min-h-13 rounded-[18px] px-6 text-base",
        icon: "size-11 px-0",
      },
      success: {
        true: "bg-success text-white hover:bg-success",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    loadingLabel?: string;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      className,
      variant,
      size,
      success,
      loading = false,
      loadingLabel,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size, success }), className);

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={classes}
          aria-busy={loading || undefined}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {loading && loadingLabel ? loadingLabel : children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { buttonVariants };
