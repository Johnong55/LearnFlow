import { Suspense } from "react";

import { RoadmapGenerationExperience } from "@/components/roadmap/roadmap-generation-experience";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppRoadmapGeneratingPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[36rem]" />}>
      <RoadmapGenerationExperience />
    </Suspense>
  );
}
