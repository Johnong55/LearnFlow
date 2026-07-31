"use client";

import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpenText,
  CalendarClock,
  Gauge,
  HeartHandshake,
  MonitorPlay,
  Puzzle,
  Rocket,
  Scale,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { OptionCard } from "@/components/onboarding/option-card";
import { StepCard } from "@/components/onboarding/step-card";
import { WeekdaySelector } from "@/components/onboarding/weekday-selector";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  LearningFormat,
  ReschedulingMode,
} from "@/features/onboarding/types";
import { isApiError } from "@/lib/api/errors";
import { onboardingApi } from "@/lib/api/onboarding.api";
import { usersApi } from "@/lib/api/users.api";
import { useOnboardingStore } from "@/stores/onboarding-store";

const formats: Array<{
  value: LearningFormat;
  title: string;
  description: string;
  icon: typeof MonitorPlay;
}> = [
  {
    value: "VIDEO",
    title: "Video",
    description: "Học qua hình ảnh",
    icon: MonitorPlay,
  },
  {
    value: "TEXT",
    title: "Bài viết & sách",
    description: "Đọc có chiều sâu",
    icon: BookOpenText,
  },
  {
    value: "INTERACTIVE",
    title: "Bài tập",
    description: "Phản hồi tức thì",
    icon: Puzzle,
  },
  {
    value: "PROJECT",
    title: "Dự án",
    description: "Học bằng thực hành",
    icon: Rocket,
  },
  {
    value: "MIXED",
    title: "Kết hợp",
    description: "Đa dạng định dạng",
    icon: Scale,
  },
];

const modes: Array<{
  value: ReschedulingMode;
  title: string;
  description: string;
  icon: typeof Scale;
}> = [
  {
    value: "BALANCED",
    title: "Cân bằng",
    description: "Giữ nhịp đều và vẫn hướng tới deadline.",
    icon: Scale,
  },
  {
    value: "DEADLINE_FOCUSED",
    title: "Tập trung deadline",
    description: "Ưu tiên tiến độ khi cần điều chỉnh.",
    icon: Zap,
  },
  {
    value: "LOW_STRESS",
    title: "Ít áp lực",
    description: "Giảm tải ngày, chấp nhận kéo dài thời gian.",
    icon: HeartHandshake,
  },
];

export default function PreferencesPage() {
  const router = useRouter();
  const draft = useOnboardingStore((state) => state.draft);
  const preferences = draft.preferences;
  const updateSection = useOnboardingStore((state) => state.updateSection);
  const markSaved = useOnboardingStore((state) => state.markSaved);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!draft.goal.targetDate)
        throw new Error("Mục tiêu chưa có ngày hoàn thành.");
      await onboardingApi.saveLearning({
        desiredSkills: draft.skills.map(
          ({ name, currentLevel, targetLevel }) => ({
            name,
            currentLevel,
            targetLevel,
          }),
        ),
        learningGoal: draft.goal.description,
        expectedDeadline: new Date(
          `${draft.goal.targetDate}T12:00:00.000Z`,
        ).toISOString(),
        hoursAvailablePerWeek: draft.goal.weeklyAvailableHours,
        preferredStudyDays: preferences.preferredStudyDays,
        preferredSessionMinutes: preferences.preferredSessionMinutes,
        preferredLearningFormat: preferences.preferredLearningFormat,
        maximumCognitiveWorkload: preferences.maximumCognitiveWorkload,
      });
      await usersApi.updateMe({
        preferredSessionMinutes: preferences.preferredSessionMinutes,
        preferredStudyTime: draft.energy.focusWindow,
        preferredStudyDays: preferences.preferredStudyDays,
        preferredLearningFormat: preferences.preferredLearningFormat,
        maxDailyLearningMinutes: preferences.maximumStudyMinutesPerDay,
        maxCognitiveLoad: preferences.maximumCognitiveWorkload,
      });
    },
    onSuccess: () => {
      markSaved();
      router.push("/onboarding/review");
    },
  });

  return (
    <StepCard
      title="Điều chỉnh nhịp học phù hợp"
      description="Đây là sở thích, không phải lời hứa cứng nhắc. Bạn luôn có thể thay đổi khi biết rõ nhịp học của mình hơn."
    >
      {mutation.error ? (
        <InlineAlert tone="error">
          {isApiError(mutation.error)
            ? mutation.error.message
            : mutation.error.message}
        </InlineAlert>
      ) : null}
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="number"
            min={15}
            max={240}
            step={5}
            label="Thời lượng một phiên (phút)"
            value={preferences.preferredSessionMinutes}
            onChange={(event) =>
              updateSection("preferences", {
                preferredSessionMinutes: Number(event.target.value),
              })
            }
          />
          <Input
            type="number"
            min={15}
            max={480}
            step={15}
            label="Học tối đa mỗi ngày (phút)"
            value={preferences.maximumStudyMinutesPerDay}
            onChange={(event) =>
              updateSection("preferences", {
                maximumStudyMinutesPerDay: Number(event.target.value),
              })
            }
          />
        </div>
        <WeekdaySelector
          label="Ngày muốn học"
          value={preferences.preferredStudyDays}
          onChange={(preferredStudyDays) =>
            updateSection("preferences", { preferredStudyDays })
          }
        />
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">
            Định dạng ưu tiên
          </legend>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {formats.map((option) => (
              <OptionCard
                key={option.value}
                {...option}
                compact
                selected={preferences.preferredLearningFormat === option.value}
                onClick={() =>
                  updateSection("preferences", {
                    preferredLearningFormat: option.value,
                  })
                }
              />
            ))}
          </div>
        </fieldset>
        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <label htmlFor="cognitive-load" className="text-sm font-semibold">
              Tải nhận thức tối đa
            </label>
            <span className="bg-primary-soft text-primary-strong rounded-full px-3 py-1 text-sm font-bold">
              {preferences.maximumCognitiveWorkload}/10
            </span>
          </div>
          <input
            id="cognitive-load"
            type="range"
            min={1}
            max={10}
            value={preferences.maximumCognitiveWorkload}
            onChange={(event) =>
              updateSection("preferences", {
                maximumCognitiveWorkload: Number(event.target.value),
              })
            }
            className="accent-primary w-full"
          />
          <div className="text-muted-foreground mt-1 flex justify-between text-xs">
            <span>Nhẹ nhàng</span>
            <span>Thử thách</span>
          </div>
        </div>
        <fieldset>
          <legend className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="size-4" /> Khi lỡ một phiên học
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {modes.map((option) => (
              <OptionCard
                key={option.value}
                {...option}
                selected={preferences.reschedulingMode === option.value}
                onClick={() =>
                  updateSection("preferences", {
                    reschedulingMode: option.value,
                  })
                }
              />
            ))}
          </div>
        </fieldset>
        <div className="bg-info-soft text-info-foreground flex gap-3 rounded-2xl p-4 text-sm leading-6">
          <Gauge className="mt-0.5 size-5 shrink-0" />
          <p>
            SkillPilot sẽ không vượt quá{" "}
            <strong>
              {preferences.maximumStudyMinutesPerDay} phút học/ngày
            </strong>{" "}
            khi tự cân bằng lại.
          </p>
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          disabled={
            !preferences.preferredStudyDays.length || mutation.isPending
          }
          loading={mutation.isPending}
          loadingLabel="Đang lưu sở thích…"
          onClick={() => mutation.mutate()}
        >
          Kiểm tra kế hoạch <ArrowRight className="size-4" />
        </Button>
      </div>
    </StepCard>
  );
}
