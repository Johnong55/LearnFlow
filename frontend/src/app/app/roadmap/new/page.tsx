"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { InlineAlert } from "@/components/feedback/inline-alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import {
  SKILL_LEVELS,
  type GoalPriority,
  type SkillLevel,
} from "@/features/onboarding/types";
import { isValidLevelProgression } from "@/features/onboarding/validation";
import { goalsApi } from "@/lib/api/goals.api";
import { isApiError } from "@/lib/api/errors";

const schema = z.object({
  title: z.string().trim().min(3, "Tên roadmap cần ít nhất 3 ký tự.").max(200),
  description: z
    .string()
    .trim()
    .min(10, "Hãy mô tả kết quả muốn đạt được.")
    .max(5000),
  skillName: z.string().trim().min(1, "Hãy nhập kỹ năng."),
  currentLevel: z.enum([
    "NONE",
    "BEGINNER",
    "ELEMENTARY",
    "INTERMEDIATE",
    "ADVANCED",
    "EXPERT",
  ]),
  targetLevel: z.enum([
    "NONE",
    "BEGINNER",
    "ELEMENTARY",
    "INTERMEDIATE",
    "ADVANCED",
    "EXPERT",
  ]),
  targetDate: z.string().min(1, "Hãy chọn deadline."),
  weeklyAvailableHours: z.coerce.number().min(0.5).max(80),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  successCriteria: z.string().trim().min(3, "Hãy thêm ít nhất một tiêu chí."),
});

type Values = z.infer<typeof schema>;

function tomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export default function NewRoadmapPage() {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      skillName: "",
      currentLevel: "NONE",
      targetLevel: "INTERMEDIATE",
      targetDate: "",
      weeklyAvailableHours: 6,
      priority: "MEDIUM",
      successCriteria: "Hoàn thành một dự án thực tế",
    },
  });
  const mutation = useMutation({
    mutationFn: async (values: Values) => {
      if (!isValidLevelProgression(values.currentLevel, values.targetLevel))
        throw new Error("Mức mục tiêu phải cao hơn mức hiện tại.");
      const criteria = values.successCriteria
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      return goalsApi.create({
        title: values.title,
        description: values.description,
        skillName: values.skillName,
        currentLevel: values.currentLevel as SkillLevel,
        targetLevel: values.targetLevel as SkillLevel,
        targetDate: new Date(
          `${values.targetDate}T12:00:00.000Z`,
        ).toISOString(),
        priority: values.priority as GoalPriority,
        weeklyAvailableHours: values.weeklyAvailableHours,
        successCriteria: criteria,
        userConstraints: {},
      });
    },
    onSuccess: (goal) =>
      router.push(`/app/roadmap/generating?goalId=${goal.id}`),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <Button asChild variant="ghost" className="mb-5">
        <Link href="/app/roadmap">
          <ArrowLeft className="size-4" /> Quay lại roadmap
        </Link>
      </Button>
      <Card className="p-5 sm:p-8 lg:p-10">
        <p className="text-primary-strong text-xs font-bold tracking-[0.14em] uppercase">
          Roadmap mới
        </p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-[-0.04em]">
          Bạn muốn chinh phục điều gì tiếp theo?
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
          Mỗi roadmap bắt đầu từ một goal riêng, sau đó được phân tích nguồn và
          chia thành kế hoạch theo ngày.
        </p>
        <form
          className="mt-8 space-y-6"
          noValidate
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          {mutation.error ? (
            <InlineAlert tone="error">
              {isApiError(mutation.error)
                ? mutation.error.message
                : mutation.error.message}
            </InlineAlert>
          ) : null}
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Tên roadmap"
              placeholder="Làm chủ Node.js backend"
              error={form.formState.errors.title?.message}
              {...form.register("title")}
            />
            <Input
              label="Kỹ năng chính"
              placeholder="Node.js"
              error={form.formState.errors.skillName?.message}
              {...form.register("skillName")}
            />
          </div>
          <Textarea
            label="Kết quả bạn muốn đạt được"
            placeholder="Tôi muốn có thể xây dựng…"
            error={form.formState.errors.description?.message}
            {...form.register("description")}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              label="Mức hiện tại"
              options={SKILL_LEVELS}
              error={form.formState.errors.currentLevel?.message}
              {...form.register("currentLevel")}
            />
            <SelectField
              label="Mức mục tiêu"
              options={SKILL_LEVELS}
              error={form.formState.errors.targetLevel?.message}
              {...form.register("targetLevel")}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Input
              type="date"
              min={tomorrow()}
              label="Deadline"
              error={form.formState.errors.targetDate?.message}
              {...form.register("targetDate")}
            />
            <Input
              type="number"
              min={0.5}
              max={80}
              step={0.5}
              label="Giờ mỗi tuần"
              error={form.formState.errors.weeklyAvailableHours?.message}
              {...form.register("weeklyAvailableHours")}
            />
            <SelectField
              label="Ưu tiên"
              options={[
                { value: "LOW", label: "Thấp" },
                { value: "MEDIUM", label: "Vừa" },
                { value: "HIGH", label: "Cao" },
                { value: "CRITICAL", label: "Rất cao" },
              ]}
              {...form.register("priority")}
            />
          </div>
          <Textarea
            label="Tiêu chí hoàn thành"
            description="Mỗi dòng là một kết quả đo lường được."
            placeholder={"Triển khai sản phẩm lên VPS\nViết đầy đủ unit test"}
            error={form.formState.errors.successCriteria?.message}
            {...form.register("successCriteria")}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              loading={mutation.isPending}
              loadingLabel="Đang tạo goal…"
            >
              <Sparkles className="size-4" /> Phân tích và tạo roadmap{" "}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
