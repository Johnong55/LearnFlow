"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import type { LearningGoal, UpdateGoalInput } from "@/lib/api/goals.api";

const schema = z.object({
  title: z.string().trim().min(3, "Tên mục tiêu cần ít nhất 3 ký tự.").max(200),
  description: z
    .string()
    .trim()
    .min(10, "Hãy mô tả rõ kết quả muốn đạt.")
    .max(5000),
  targetDate: z.string().min(1, "Hãy chọn deadline."),
  weeklyAvailableHours: z.coerce.number().min(0.5).max(80),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  successCriteria: z
    .string()
    .trim()
    .min(3, "Cần ít nhất một tiêu chí hoàn thành."),
});

type Values = z.infer<typeof schema>;

export function GoalEditorDialog({
  goal,
  open,
  saving,
  onOpenChange,
  onSave,
}: {
  goal: LearningGoal | null;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: UpdateGoalInput) => void;
}) {
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!goal) return;
    form.reset({
      title: goal.title,
      description: goal.description,
      targetDate: goal.targetDate.slice(0, 10),
      weeklyAvailableHours: Number(goal.weeklyAvailableHours),
      priority: goal.priority,
      successCriteria: goal.successCriteria.join("\n"),
    });
  }, [form, goal]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-sm" />
        <Dialog.Content className="border-border bg-background fixed inset-x-0 bottom-0 z-50 max-h-[94vh] overflow-y-auto rounded-t-[30px] border p-5 shadow-2xl outline-none sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[min(94vw,44rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-2xl font-bold">
                Điều chỉnh mục tiêu
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground mt-1 text-sm">
                Thay đổi này không xóa roadmap hoặc dữ liệu tiến độ đã có.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button size="icon" variant="ghost" aria-label="Đóng">
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>
          <form
            className="mt-6 space-y-5"
            noValidate
            onSubmit={form.handleSubmit((values) => {
              onSave({
                title: values.title,
                description: values.description,
                targetDate: new Date(
                  `${values.targetDate}T12:00:00.000Z`,
                ).toISOString(),
                weeklyAvailableHours: values.weeklyAvailableHours,
                priority: values.priority,
                successCriteria: values.successCriteria
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean),
              });
            })}
          >
            <Input
              label="Tên mục tiêu"
              error={form.formState.errors.title?.message}
              {...form.register("title")}
            />
            <Textarea
              label="Kết quả muốn đạt"
              error={form.formState.errors.description?.message}
              {...form.register("description")}
            />
            <div className="grid gap-5 sm:grid-cols-3">
              <Input
                type="date"
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
                label="Mức ưu tiên"
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
              description="Mỗi dòng là một kết quả có thể kiểm chứng."
              error={form.formState.errors.successCriteria?.message}
              {...form.register("successCriteria")}
            />
            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Hủy
                </Button>
              </Dialog.Close>
              <Button type="submit" loading={saving} loadingLabel="Đang lưu…">
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
