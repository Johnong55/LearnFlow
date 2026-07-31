import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-2xl bg-[linear-gradient(100deg,var(--surface-muted)_30%,var(--surface)_50%,var(--surface-muted)_70%)] bg-[length:220%_100%]",
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      className="border-border bg-surface rounded-[28px] border p-6"
      aria-label="Đang tải nội dung"
    >
      <Skeleton className="mb-5 h-5 w-1/3" />
      <Skeleton className="mb-3 h-9 w-4/5" />
      <Skeleton className="mb-8 h-4 w-full" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  );
}
