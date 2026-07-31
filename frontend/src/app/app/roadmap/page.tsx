import { Suspense } from "react";

import { RoadmapExplorer } from "@/components/roadmap/roadmap-explorer";
import { Skeleton } from "@/components/ui/skeleton";

export default function RoadmapPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[36rem]" />}>
      <RoadmapExplorer />
    </Suspense>
  );
}
