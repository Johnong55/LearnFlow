"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Building2, Clock3, House, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { OptionCard } from "@/components/onboarding/option-card";
import { StepCard } from "@/components/onboarding/step-card";
import { WeekdaySelector } from "@/components/onboarding/weekday-selector";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { workSchema } from "@/features/onboarding/validation";
import { isApiError } from "@/lib/api/errors";
import { onboardingApi } from "@/lib/api/onboarding.api";
import { useOnboardingStore } from "@/stores/onboarding-store";

type WorkValues = z.infer<typeof workSchema>;

export default function WorkPage() {
  const router = useRouter();
  const work = useOnboardingStore((state) => state.draft.work);
  const updateSection = useOnboardingStore((state) => state.updateSection);
  const markSaved = useOnboardingStore((state) => state.markSaved);
  const form = useForm<WorkValues>({
    resolver: zodResolver(workSchema),
    defaultValues: {
      startTime: work.startTime,
      endTime: work.endTime,
      commuteMinutes: work.commuteMinutes,
    },
  });
  const mutation = useMutation({
    mutationFn: (values: WorkValues) =>
      onboardingApi.saveWork({ ...work, ...values }),
    onSuccess: (_data, values) => {
      updateSection("work", values);
      markSaved();
      router.push("/onboarding/sleep");
    },
  });

  return (
    <StepCard
      title="Tuần làm việc của bạn trông như thế nào?"
      description="Khoảng thời gian này sẽ trở thành vùng được bảo vệ; phiên học không thể chồng lên công việc cố định."
    >
      <form
        className="space-y-7"
        noValidate
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        {mutation.error ? (
          <InlineAlert tone="error">
            {isApiError(mutation.error)
              ? mutation.error.message
              : "Chưa thể lưu lịch làm việc."}
          </InlineAlert>
        ) : null}
        <WeekdaySelector
          label="Ngày làm việc"
          value={work.workingDays}
          onChange={(workingDays) => updateSection("work", { workingDays })}
        />
        {work.workingDays.length === 0 ? (
          <p role="alert" className="text-danger text-sm">
            Hãy chọn ít nhất một ngày làm việc.
          </p>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            type="time"
            label="Bắt đầu"
            error={form.formState.errors.startTime?.message}
            {...form.register("startTime")}
          />
          <Input
            type="time"
            label="Kết thúc"
            error={form.formState.errors.endTime?.message}
            {...form.register("endTime")}
          />
          <Input
            type="number"
            min={0}
            max={240}
            label="Di chuyển (phút / chiều)"
            error={form.formState.errors.commuteMinutes?.message}
            {...form.register("commuteMinutes")}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <OptionCard
            title="Văn phòng"
            description="Có thời gian di chuyển"
            icon={Building2}
            selected={work.workMode === "OFFICE"}
            onClick={() => updateSection("work", { workMode: "OFFICE" })}
          />
          <OptionCard
            title="Từ xa"
            description="Không cần di chuyển"
            icon={House}
            selected={work.workMode === "REMOTE"}
            onClick={() =>
              updateSection("work", { workMode: "REMOTE", commuteMinutes: 0 })
            }
          />
          <OptionCard
            title="Kết hợp"
            description="Một số ngày tại văn phòng"
            icon={Shuffle}
            selected={work.workMode === "HYBRID"}
            onClick={() => updateSection("work", { workMode: "HYBRID" })}
          />
        </div>
        <label className="bg-surface-muted flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-4">
          <span>
            <span className="flex items-center gap-2 font-semibold">
              <Clock3 className="size-4" /> Giờ làm linh hoạt
            </span>
            <span className="text-muted-foreground mt-1 block text-xs">
              Cho phép hệ thống ưu tiên thay vì khóa cứng khoảng giờ này.
            </span>
          </span>
          <input
            type="checkbox"
            checked={work.flexibleHours}
            onChange={(event) =>
              updateSection("work", { flexibleHours: event.target.checked })
            }
            className="accent-primary size-5"
          />
        </label>
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={work.workingDays.length === 0}
            loading={mutation.isPending}
            loadingLabel="Đang lưu lịch…"
          >
            Tiếp tục <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>
    </StepCard>
  );
}
