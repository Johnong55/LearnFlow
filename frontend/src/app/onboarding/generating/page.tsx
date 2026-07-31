import { Suspense } from "react";

import { RoadmapGenerationExperience } from "@/components/roadmap/roadmap-generation-experience";

export default function GeneratingPage() {
  return (
    <Suspense fallback={<GenerationPageSkeleton />}>
      <RoadmapGenerationExperience />
    </Suspense>
  );
}

function GenerationPageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-5" role="status">
      <div className="bg-surface-muted mx-auto size-20 rounded-[28px]" />
      <div className="bg-surface-muted mx-auto h-10 w-3/4 rounded-xl" />
      <div className="bg-surface-muted mx-auto h-5 w-1/2 rounded-lg" />
      <div className="bg-surface-muted mt-10 h-72 rounded-[28px]" />
      <span className="sr-only">Đang mở tiến trình tạo roadmap…</span>
    </div>
  );
}
