import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-7" aria-busy="true" aria-live="polite">
      <span className="sr-only">Đang tải không gian học tập</span>
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
