"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  House,
  Shuffle,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { OptionCard } from "@/components/onboarding/option-card";
import { StepCard } from "@/components/onboarding/step-card";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { aboutSchema } from "@/features/onboarding/validation";
import { isApiError } from "@/lib/api/errors";
import { usersApi } from "@/lib/api/users.api";
import { useAuthStore } from "@/stores/auth-store";
import { useOnboardingStore } from "@/stores/onboarding-store";

type AboutValues = z.infer<typeof aboutSchema>;

const arrangements = [
  { value: "OFFICE" as const, title: "Văn phòng", icon: BriefcaseBusiness },
  { value: "REMOTE" as const, title: "Từ xa", icon: House },
  { value: "HYBRID" as const, title: "Kết hợp", icon: Users },
  { value: "STUDENT" as const, title: "Sinh viên", icon: GraduationCap },
  { value: "FLEXIBLE" as const, title: "Lịch linh hoạt", icon: Shuffle },
];

export default function AboutYouPage() {
  const router = useRouter();
  const draft = useOnboardingStore((state) => state.draft);
  const updateSection = useOnboardingStore((state) => state.updateSection);
  const markSaved = useOnboardingStore((state) => state.markSaved);
  const setUser = useAuthStore((state) => state.setUser);
  const form = useForm<AboutValues>({
    resolver: zodResolver(aboutSchema),
    defaultValues: draft.personal,
  });
  const mutation = useMutation({
    mutationFn: (values: AboutValues) => usersApi.updateMe(values),
    onSuccess: (user, values) => {
      updateSection("personal", values);
      setUser(user);
      markSaved();
      router.push("/onboarding/work");
    },
  });

  const arrangement = draft.personal.scheduleKind;

  return (
    <StepCard
      title="Một chút về bạn"
      description="Thông tin này giúp kế hoạch dùng đúng ngôn ngữ, múi giờ và bối cảnh công việc của bạn."
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
              : "Chưa thể lưu thông tin."}
          </InlineAlert>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Tên hiển thị"
            placeholder="Minh Trí"
            error={form.formState.errors.fullName?.message}
            {...form.register("fullName")}
          />
          <Input
            label="Công việc hiện tại"
            placeholder="Lập trình viên, sinh viên…"
            error={form.formState.errors.occupation?.message}
            {...form.register("occupation")}
          />
          <Input
            label="Chức danh (không bắt buộc)"
            placeholder="Backend Developer"
            error={form.formState.errors.jobTitle?.message}
            {...form.register("jobTitle")}
          />
          <SelectField
            label="Múi giờ"
            options={[
              { value: "Asia/Ho_Chi_Minh", label: "Việt Nam (GMT+7)" },
              { value: "Asia/Bangkok", label: "Bangkok (GMT+7)" },
              { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
              { value: "UTC", label: "UTC" },
            ]}
            {...form.register("timezone")}
          />
        </div>
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">
            Lịch làm việc gần với bạn nhất
          </legend>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {arrangements.map((item) => (
              <OptionCard
                key={item.value}
                title={item.title}
                icon={item.icon}
                compact
                selected={arrangement === item.value}
                onClick={() =>
                  updateSection("personal", { scheduleKind: item.value })
                }
              />
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            loading={mutation.isPending}
            loadingLabel="Đang lưu…"
          >
            Tiếp tục <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>
    </StepCard>
  );
}
