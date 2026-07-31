import { SkeletonCard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      className="page-shell grid min-h-screen content-center gap-6 py-24"
      aria-busy="true"
    >
      <span className="sr-only">Đang tải trang</span>
      <div className="mx-auto w-full max-w-3xl space-y-4 text-center">
        <div className="bg-primary-soft mx-auto h-5 w-28 animate-pulse rounded-full" />
        <div className="bg-surface-muted mx-auto h-12 w-4/5 animate-pulse rounded-2xl" />
        <div className="bg-surface-muted mx-auto h-5 w-3/5 animate-pulse rounded-xl" />
      </div>
      <div className="mx-auto w-full max-w-4xl">
        <SkeletonCard />
      </div>
    </main>
  );
}
