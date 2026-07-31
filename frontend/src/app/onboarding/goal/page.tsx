"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Plus, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { StepCard } from "@/components/onboarding/step-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { goalSchema } from "@/features/onboarding/validation";
import { useOnboardingStore } from "@/stores/onboarding-store";

type GoalValues = z.infer<typeof goalSchema>;

function tomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export default function GoalPage() {
  const router = useRouter();
  const draft = useOnboardingStore((state) => state.draft);
  const updateSection = useOnboardingStore((state) => state.updateSection);
  const form = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: draft.goal,
  });
  const skill = draft.skills[0];

  const suggest = () => {
    if (!skill) return;
    form.setValue(
      "title",
      `Làm chủ ${skill.name} ở mức ${skill.targetLevel.toLocaleLowerCase()}`,
      { shouldValidate: true },
    );
    form.setValue(
      "description",
      `Học ${skill.name} một cách có hệ thống và hoàn thành một sản phẩm thực tế để chứng minh năng lực.`,
      { shouldValidate: true },
    );
  };
  const submit = (values: GoalValues) => {
    updateSection("goal", values);
    router.push("/onboarding/preferences");
  };
  const criteria = draft.goal.successCriteria;

  return (
    <StepCard
      title="Thành công sẽ trông như thế nào?"
      description={`Biến “học ${skill?.name ?? "một kỹ năng"}” thành một kết quả đủ rõ để biết khi nào bạn đã đạt được.`}
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={form.handleSubmit(submit)}
      >
        <div className="flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={suggest}>
            <Sparkles className="size-4" /> Gợi ý cách viết
          </Button>
        </div>
        <Input
          label="Tên mục tiêu"
          placeholder="Xây dựng và triển khai REST API hoàn chỉnh"
          error={form.formState.errors.title?.message}
          {...form.register("title")}
        />
        <Textarea
          label="Mô tả kết quả mong muốn"
          placeholder="Tôi muốn có thể…"
          error={form.formState.errors.description?.message}
          {...form.register("description")}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            type="date"
            min={tomorrow()}
            label="Ngày mục tiêu"
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
            value={draft.goal.priority}
            onChange={(event) =>
              updateSection("goal", {
                priority: event.target.value as typeof draft.goal.priority,
              })
            }
            options={[
              { value: "LOW", label: "Thấp" },
              { value: "MEDIUM", label: "Vừa" },
              { value: "HIGH", label: "Cao" },
              { value: "CRITICAL", label: "Rất cao" },
            ]}
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            Tiêu chí hoàn thành
          </legend>
          <p className="text-muted-foreground mb-3 text-xs">
            Những bằng chứng cụ thể cho thấy bạn đã đạt mục tiêu.
          </p>
          <div className="space-y-2">
            {criteria.map((criterion, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  label={`Tiêu chí ${index + 1}`}
                  className="min-h-11"
                  value={criterion}
                  onChange={(event) =>
                    updateSection("goal", {
                      successCriteria: criteria.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item,
                      ),
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-7 shrink-0"
                  aria-label="Xóa tiêu chí"
                  onClick={() =>
                    updateSection("goal", {
                      successCriteria: criteria.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    })
                  }
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() =>
              updateSection("goal", { successCriteria: [...criteria, ""] })
            }
          >
            <Plus className="size-4" /> Thêm tiêu chí
          </Button>
        </fieldset>
        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Tiếp tục <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>
    </StepCard>
  );
}
