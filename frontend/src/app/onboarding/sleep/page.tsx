"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, MoonStar, ShieldCheck, Sunrise } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { StepCard } from "@/components/onboarding/step-card";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sleepSchema } from "@/features/onboarding/validation";
import { isApiError } from "@/lib/api/errors";
import { onboardingApi } from "@/lib/api/onboarding.api";
import { useOnboardingStore } from "@/stores/onboarding-store";

type SleepValues = z.infer<typeof sleepSchema>;

export default function SleepPage() {
  const router = useRouter();
  const { sleep, personal } = useOnboardingStore((state) => state.draft);
  const updateSection = useOnboardingStore((state) => state.updateSection);
  const markSaved = useOnboardingStore((state) => state.markSaved);
  const form = useForm<SleepValues>({
    resolver: zodResolver(sleepSchema),
    defaultValues: { wakeUpTime: sleep.wakeUpTime, sleepTime: sleep.sleepTime },
  });
  const mutation = useMutation({
    mutationFn: (values: SleepValues) =>
      onboardingApi.savePersonal({
        occupation: personal.occupation,
        ...(personal.jobTitle ? { jobTitle: personal.jobTitle } : {}),
        timezone: personal.timezone,
        locale: personal.locale,
        ...values,
      }),
    onSuccess: (_data, values) => {
      updateSection("sleep", values);
      markSaved();
      router.push("/onboarding/routines");
    },
  });

  return (
    <StepCard
      title="Bảo vệ thời gian phục hồi của bạn"
      description="SkillPilot sẽ không dùng giấc ngủ như một khoảng trống để nhét thêm bài học."
    >
      <form
        className="space-y-6"
        noValidate
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        {mutation.error ? (
          <InlineAlert tone="error">
            {isApiError(mutation.error)
              ? mutation.error.message
              : "Chưa thể lưu lịch ngủ."}
          </InlineAlert>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border-border bg-surface-muted/65 rounded-[24px] border p-5">
            <MoonStar className="text-info mb-4 size-6" />
            <Input
              type="time"
              label="Thường đi ngủ lúc"
              error={form.formState.errors.sleepTime?.message}
              {...form.register("sleepTime")}
            />
          </div>
          <div className="border-border bg-surface-muted/65 rounded-[24px] border p-5">
            <Sunrise className="text-warning mb-4 size-6" />
            <Input
              type="time"
              label="Thường thức dậy lúc"
              error={form.formState.errors.wakeUpTime?.message}
              {...form.register("wakeUpTime")}
            />
          </div>
        </div>
        <label className="bg-surface-muted flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-4">
          <span>
            <strong>Lịch cuối tuần khác</strong>
            <span className="text-muted-foreground mt-1 block text-xs">
              Lưu lại để dùng khi thuật toán hỗ trợ lịch ngủ riêng theo ngày.
            </span>
          </span>
          <input
            type="checkbox"
            className="accent-primary size-5"
            checked={sleep.weekendDifferent}
            onChange={(event) =>
              updateSection("sleep", { weekendDifferent: event.target.checked })
            }
          />
        </label>
        {sleep.weekendDifferent ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="time"
              label="Ngủ cuối tuần"
              value={sleep.weekendSleepTime}
              onChange={(event) =>
                updateSection("sleep", { weekendSleepTime: event.target.value })
              }
            />
            <Input
              type="time"
              label="Thức dậy cuối tuần"
              value={sleep.weekendWakeUpTime}
              onChange={(event) =>
                updateSection("sleep", {
                  weekendWakeUpTime: event.target.value,
                })
              }
            />
          </div>
        ) : null}
        <div className="border-success/25 bg-success-soft text-success-foreground flex gap-3 rounded-2xl border p-4 text-sm leading-6">
          <ShieldCheck className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>Đây là ràng buộc cứng.</strong> Hệ thống lập lịch không được
            xếp phiên học vào khoảng ngủ đã bảo vệ.
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            loading={mutation.isPending}
            loadingLabel="Đang bảo vệ lịch ngủ…"
          >
            Tiếp tục <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>
    </StepCard>
  );
}
