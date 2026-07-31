"use client";

import {
  ArrowRight,
  CloudSun,
  Moon,
  Sparkles,
  Sunrise,
  Sun,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { OptionCard } from "@/components/onboarding/option-card";
import { StepCard } from "@/components/onboarding/step-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useOnboardingStore } from "@/stores/onboarding-store";

const focusOptions = [
  {
    value: "EARLY_MORNING" as const,
    title: "Sáng sớm",
    description: "05:00–08:00",
    icon: Sunrise,
  },
  {
    value: "MORNING" as const,
    title: "Buổi sáng",
    description: "08:00–12:00",
    icon: Sun,
  },
  {
    value: "AFTERNOON" as const,
    title: "Buổi chiều",
    description: "12:00–18:00",
    icon: CloudSun,
  },
  {
    value: "EVENING" as const,
    title: "Buổi tối",
    description: "18:00–23:00",
    icon: Moon,
  },
  {
    value: "VARIES" as const,
    title: "Thay đổi",
    description: "Không cố định",
    icon: Sparkles,
  },
];

const levels = [
  { value: "LOW" as const, label: "Thấp" },
  { value: "MEDIUM" as const, label: "Vừa" },
  { value: "HIGH" as const, label: "Cao" },
];

export default function EnergyPage() {
  const router = useRouter();
  const energy = useOnboardingStore((state) => state.draft.energy);
  const updateSection = useOnboardingStore((state) => state.updateSection);

  return (
    <StepCard
      title="Khi nào bạn tập trung tốt nhất?"
      description="Các bài khó sẽ được ưu tiên vào lúc năng lượng cao; ôn tập nhẹ có thể nằm ở khoảng năng lượng thấp hơn."
    >
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {focusOptions.map((option) => (
          <OptionCard
            key={option.value}
            {...option}
            compact
            selected={energy.focusWindow === option.value}
            onClick={() =>
              updateSection("energy", { focusWindow: option.value })
            }
          />
        ))}
      </div>
      <div className="mt-8 overflow-hidden rounded-[24px] border">
        {(["morning", "afternoon", "evening"] as const).map((period, index) => (
          <div
            key={period}
            className="border-border grid gap-3 border-b p-4 last:border-0 sm:grid-cols-[9rem_1fr] sm:items-center"
          >
            <div>
              <strong className="block text-sm">
                {["Buổi sáng", "Buổi chiều", "Buổi tối"][index]}
              </strong>
              <span className="text-muted-foreground text-xs">
                {["06:00–12:00", "12:00–18:00", "18:00–23:00"][index]}
              </span>
            </div>
            <div className="bg-surface-muted grid grid-cols-3 gap-1 rounded-xl p-1">
              {levels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  aria-pressed={energy[period] === level.value}
                  onClick={() =>
                    updateSection("energy", { [period]: level.value })
                  }
                  className={cn(
                    "focus-visible:ring-ring/35 min-h-10 rounded-lg text-xs font-semibold transition outline-none",
                    energy[period] === level.value &&
                      "bg-surface text-primary-strong shadow-sm",
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-4 text-xs leading-5">
        Đây là ưu tiên mềm. Công việc, giấc ngủ và sự kiện cố định vẫn luôn được
        tôn trọng trước.
      </p>
      <div className="mt-8 flex justify-end">
        <Button size="lg" onClick={() => router.push("/onboarding/skills")}>
          Tiếp tục <ArrowRight className="size-4" />
        </Button>
      </div>
    </StepCard>
  );
}
