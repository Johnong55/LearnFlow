"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Clock3, Minus, Plus, X } from "lucide-react";
import { useState } from "react";

import { WeekdaySelector } from "@/components/onboarding/weekday-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import type { RoutineDraft } from "@/features/onboarding/types";

type RoutineEditorProps = {
  open: boolean;
  routine: RoutineDraft | null;
  onOpenChange: (open: boolean) => void;
  onSave: (routine: RoutineDraft) => void;
};

function moveTime(value: string, amount: number): string {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  const total = (hours * 60 + minutes + amount + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function RoutineEditor({
  open,
  routine,
  onOpenChange,
  onSave,
}: RoutineEditorProps) {
  const [draft, setDraft] = useState<RoutineDraft | null>(routine);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!draft) return;
    if (draft.title.trim().length < 2)
      return setError("Tên hoạt động cần ít nhất 2 ký tự.");
    if (!draft.weekdays.length) return setError("Hãy chọn ít nhất một ngày.");
    if (draft.startTime === draft.endTime)
      return setError("Giờ bắt đầu và kết thúc phải khác nhau.");
    setError(null);
    onSave({ ...draft, title: draft.title.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=closed]:animate-out data-[state=open]:animate-in fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-sm" />
        <Dialog.Content className="border-border bg-background fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-[30px] border p-5 shadow-2xl outline-none sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[88vh] sm:w-[min(92vw,42rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-2xl font-bold">
                Chỉnh hoạt động
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground mt-1 text-sm">
                Thời gian cố định sẽ được bảo vệ khi xếp lịch học.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Đóng">
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          {draft ? (
            <div className="space-y-5">
              {error ? (
                <p
                  role="alert"
                  className="border-danger/20 bg-coral-soft text-danger rounded-xl border px-4 py-3 text-sm"
                >
                  {error}
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Tên hoạt động"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft({ ...draft, title: event.target.value })
                  }
                />
                <SelectField
                  label="Loại"
                  value={draft.type}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      type: event.target.value as RoutineDraft["type"],
                    })
                  }
                  options={[
                    ["BREAKFAST", "Bữa sáng"],
                    ["LUNCH", "Bữa trưa"],
                    ["DINNER", "Bữa tối"],
                    ["EXERCISE", "Tập luyện"],
                    ["COMMUTE", "Di chuyển"],
                    ["FAMILY", "Gia đình"],
                    ["HOUSEWORK", "Việc nhà"],
                    ["ENTERTAINMENT", "Giải trí"],
                    ["HYGIENE", "Chăm sóc cá nhân"],
                    ["REST", "Nghỉ ngơi"],
                    ["PERSONAL", "Cá nhân"],
                    ["OTHER", "Khác"],
                  ].map(([value, label]) => ({ value: value!, label: label! }))}
                />
              </div>
              <WeekdaySelector
                value={draft.weekdays}
                onChange={(weekdays) => setDraft({ ...draft, weekdays })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {(["startTime", "endTime"] as const).map((field) => (
                  <div key={field} className="space-y-2">
                    <Input
                      type="time"
                      label={field === "startTime" ? "Bắt đầu" : "Kết thúc"}
                      value={draft[field]}
                      onChange={(event) =>
                        setDraft({ ...draft, [field]: event.target.value })
                      }
                    />
                    <div
                      className="flex gap-2"
                      aria-label={`Điều chỉnh ${field === "startTime" ? "giờ bắt đầu" : "giờ kết thúc"}`}
                    >
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            [field]: moveTime(draft[field], -15),
                          })
                        }
                      >
                        <Minus className="size-3" /> 15 phút
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            [field]: moveTime(draft[field], 15),
                          })
                        }
                      >
                        <Plus className="size-3" /> 15 phút
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  type="number"
                  min={0}
                  max={180}
                  label="Đệm trước (phút)"
                  value={draft.bufferBeforeMinutes}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      bufferBeforeMinutes: Number(event.target.value),
                    })
                  }
                />
                <Input
                  type="number"
                  min={0}
                  max={180}
                  label="Đệm sau (phút)"
                  value={draft.bufferAfterMinutes}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      bufferAfterMinutes: Number(event.target.value),
                    })
                  }
                />
                <SelectField
                  label="Mức bảo vệ"
                  value={draft.constraintPriority}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      constraintPriority: event.target.value as "HARD" | "SOFT",
                    })
                  }
                  options={[
                    { value: "HARD", label: "Cố định" },
                    { value: "SOFT", label: "Linh hoạt" },
                  ]}
                />
              </div>
              <label className="bg-surface-muted flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-4">
                <span>
                  <span className="flex items-center gap-2 font-semibold">
                    <Clock3 className="size-4" /> Có thể dịch chuyển
                  </span>
                  <span className="text-muted-foreground mt-1 block text-xs">
                    Cho phép ưu tiên thời lượng thay vì đúng giờ tuyệt đối.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="accent-primary size-5"
                  checked={draft.isFlexible}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      isFlexible: event.target.checked,
                      constraintPriority: event.target.checked
                        ? "SOFT"
                        : "HARD",
                    })
                  }
                />
              </label>
              <div className="flex justify-end gap-3">
                <Dialog.Close asChild>
                  <Button variant="secondary">Hủy</Button>
                </Dialog.Close>
                <Button onClick={submit}>Lưu hoạt động</Button>
              </div>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
