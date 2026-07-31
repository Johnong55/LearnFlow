import { Route } from "lucide-react";
import Link from "next/link";

import { BRAND } from "@/config/brand";
import { cn } from "@/lib/utils/cn";

export function AppLogo({
  compact = false,
  className,
  href = "/",
  destinationLabel = "Trang chủ",
}: {
  compact?: boolean;
  className?: string;
  href?: string;
  destinationLabel?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`${BRAND.name} — ${destinationLabel}`}
      className={cn(
        "group focus-visible:ring-ring/35 inline-flex min-h-11 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-3",
        className,
      )}
    >
      <span className="bg-primary-deep text-primary grid size-10 place-items-center rounded-[15px] shadow-[0_8px_22px_-10px_var(--primary-deep)] transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-3">
        <Route className="size-5" strokeWidth={2.6} aria-hidden="true" />
      </span>
      {!compact ? (
        <span className="font-display text-foreground text-xl font-bold tracking-[-0.03em]">
          {BRAND.name}
        </span>
      ) : null}
    </Link>
  );
}
