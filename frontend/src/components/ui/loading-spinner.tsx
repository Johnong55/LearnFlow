import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export function LoadingSpinner({
  className,
  label = "Đang tải",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <LoaderCircle
        className={cn("text-primary size-5 animate-spin", className)}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
