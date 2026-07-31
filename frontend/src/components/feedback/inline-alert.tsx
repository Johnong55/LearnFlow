import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type AlertTone = "error" | "success" | "info";

const styles: Record<AlertTone, string> = {
  error: "border-danger/25 bg-coral-soft text-coral-foreground",
  success: "border-success/25 bg-success-soft text-success-foreground",
  info: "border-info/25 bg-info-soft text-info-foreground",
};

const icons = { error: AlertCircle, success: CheckCircle2, info: Info };

export function InlineAlert({
  tone = "info",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: AlertTone }) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6",
        styles[tone],
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
