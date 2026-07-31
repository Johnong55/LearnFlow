"use client";

import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { StepCard } from "@/components/onboarding/step-card";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Button } from "@/components/ui/button";
import { goalsApi } from "@/lib/api/goals.api";
import { isApiError } from "@/lib/api/errors";
import { onboardingApi } from "@/lib/api/onboarding.api";
import { authApi } from "@/lib/api/auth.api";
import { useAuthStore } from "@/stores/auth-store";
import { useOnboardingStore } from "@/stores/onboarding-store";

type ReviewRowProps = {
  icon: typeof Clock3;
  title: string;
  value: string;
  href: string;
};

function ReviewRow({ icon: Icon, title, value, href }: ReviewRowProps) {
  return (
    <div className="border-border flex items-start gap-4 border-b py-5 last:border-0">
      <span className="bg-primary-soft text-primary-strong grid size-11 shrink-0 place-items-center rounded-2xl">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1 text-sm leading-6">{value}</p>
      </div>
      <Button asChild variant="ghost" size="icon">
        <Link href={href} aria-label={`Sửa ${title}`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const draft = useOnboardingStore((state) => state.draft);
  const completedGoalId = useOnboardingStore((state) => state.completedGoalId);
  const setCompletedGoalId = useOnboardingStore(
    (state) => state.setCompletedGoalId,
  );
  const setUser = useAuthStore((state) => state.setUser);
  const primarySkill = draft.skills[0];
  const capacity = Math.min(
    draft.goal.weeklyAvailableHours,
    (draft.preferences.preferredStudyDays.length *
      draft.preferences.maximumStudyMinutesPerDay) /
      60,
  );
  const deadline = draft.goal.targetDate
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" }).format(
        new Date(`${draft.goal.targetDate}T12:00:00`),
      )
    : "Chưa chọn";
  const criteria = draft.goal.successCriteria
    .map((item) => item.trim())
    .filter(Boolean);
  const warnings = [
    ...(capacity < draft.goal.weeklyAvailableHours
      ? [
          `Sở thích hiện tại chỉ tạo khoảng ${capacity.toFixed(1)} giờ/tuần, thấp hơn ${draft.goal.weeklyAvailableHours} giờ bạn đặt cho mục tiêu.`,
        ]
      : []),
    ...(!draft.routines.length
      ? ["Bạn chưa thêm hoạt động đời sống nào ngoài công việc và giấc ngủ."]
      : []),
  ];
  const mutation = useMutation({
    mutationFn: async () => {
      if (!primarySkill) throw new Error("Chưa có kỹ năng chính.");
      if (!criteria.length)
        throw new Error("Hãy thêm ít nhất một tiêu chí hoàn thành.");
      await onboardingApi.complete();
      if (completedGoalId) return completedGoalId;
      const goal = await goalsApi.create({
        title: draft.goal.title,
        description: draft.goal.description,
        skillName: primarySkill.name,
        currentLevel: primarySkill.currentLevel,
        targetLevel: primarySkill.targetLevel,
        targetDate: new Date(
          `${draft.goal.targetDate}T12:00:00.000Z`,
        ).toISOString(),
        priority: draft.goal.priority,
        weeklyAvailableHours: draft.goal.weeklyAvailableHours,
        successCriteria: criteria,
        userConstraints: {
          focusWindow: draft.energy.focusWindow,
          reschedulingMode: draft.preferences.reschedulingMode,
          maximumStudyMinutesPerDay:
            draft.preferences.maximumStudyMinutesPerDay,
        },
      });
      setCompletedGoalId(goal.id);
      return goal.id;
    },
    onSuccess: async (goalId) => {
      try {
        setUser(await authApi.me());
      } catch {
        /* Session remains valid; profile can refresh later. */
      }
      toast.success("Hồ sơ học tập đã sẵn sàng");
      router.push(`/onboarding/generating?goalId=${goalId}`);
    },
  });

  return (
    <StepCard
      title="Một kế hoạch thực tế bắt đầu từ đây"
      description="Kiểm tra lại những khoảng thời gian được bảo vệ và mục tiêu chính trước khi tạo roadmap."
    >
      {mutation.error ? (
        <InlineAlert tone="error">
          {isApiError(mutation.error)
            ? mutation.error.message
            : mutation.error.message}
        </InlineAlert>
      ) : null}
      <div className="bg-primary-deep text-background rounded-[26px] p-6 sm:p-7">
        <p className="text-primary text-xs font-bold tracking-[0.14em] uppercase">
          Năng lực học khả dụng
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-x-3">
          <strong className="font-display text-4xl sm:text-5xl">
            {capacity.toFixed(1)}
          </strong>
          <span className="pb-1 text-sm opacity-75">giờ mỗi tuần</span>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 opacity-75">
          Tính từ ngày học ưu tiên và giới hạn học mỗi ngày. Thuật toán lập lịch
          sẽ kiểm tra chi tiết từng khoảng trống ở bước sau.
        </p>
      </div>
      {warnings.length ? (
        <div className="border-warning/30 bg-accent-soft mt-5 rounded-2xl border p-4">
          <div className="flex gap-3">
            <AlertTriangle className="text-warning mt-0.5 size-5 shrink-0" />
            <div>
              <strong className="text-sm">Có điều cần lưu ý</strong>
              <ul className="text-muted-foreground mt-1 list-disc space-y-1 pl-4 text-sm">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-success/25 bg-success-soft text-success-foreground mt-5 flex gap-3 rounded-2xl border p-4 text-sm">
          <CheckCircle2 className="size-5" /> Thiết lập hiện tại không có cảnh
          báo rõ ràng.
        </div>
      )}
      <div className="mt-5">
        <ReviewRow
          icon={BookOpen}
          title="Mục tiêu"
          value={`${draft.goal.title || "Chưa đặt tên"} · ${primarySkill?.name ?? "Chưa có kỹ năng"} · hạn ${deadline}`}
          href="/onboarding/goal"
        />
        <ReviewRow
          icon={BriefcaseBusiness}
          title="Công việc"
          value={`${draft.work.workingDays.length} ngày/tuần · ${draft.work.startTime}–${draft.work.endTime} · ${draft.work.workMode}`}
          href="/onboarding/work"
        />
        <ReviewRow
          icon={BedDouble}
          title="Giấc ngủ"
          value={`${draft.sleep.sleepTime}–${draft.sleep.wakeUpTime} · được bảo vệ mỗi ngày`}
          href="/onboarding/sleep"
        />
        <ReviewRow
          icon={CalendarDays}
          title="Hoạt động đời sống"
          value={`${draft.routines.length} hoạt động lặp lại`}
          href="/onboarding/routines"
        />
        <ReviewRow
          icon={Clock3}
          title="Nhịp học"
          value={`${draft.preferences.preferredSessionMinutes} phút/phiên · tối đa ${draft.preferences.maximumStudyMinutesPerDay} phút/ngày · ${draft.preferences.reschedulingMode}`}
          href="/onboarding/preferences"
        />
      </div>
      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          loading={mutation.isPending}
          loadingLabel="Đang chuẩn bị hồ sơ…"
          onClick={() => mutation.mutate()}
        >
          <Sparkles className="size-4" /> Xây roadmap của tôi{" "}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </StepCard>
  );
}
