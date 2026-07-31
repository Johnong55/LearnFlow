"use client";

import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  Coffee,
  Dumbbell,
  List,
  Plus,
  Soup,
  Sparkles,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { RoutineEditor } from "@/components/onboarding/routine-editor";
import { StepCard } from "@/components/onboarding/step-card";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Button } from "@/components/ui/button";
import type { RoutineDraft, RoutineType } from "@/features/onboarding/types";
import { WEEKDAY_LABELS } from "@/features/onboarding/types";
import { isApiError } from "@/lib/api/errors";
import { onboardingApi } from "@/lib/api/onboarding.api";
import { cn } from "@/lib/utils/cn";
import { useOnboardingStore } from "@/stores/onboarding-store";

const templates = [
  {
    type: "BREAKFAST" as const,
    title: "Bữa sáng",
    startTime: "07:00",
    endTime: "07:30",
    icon: Coffee,
  },
  {
    type: "LUNCH" as const,
    title: "Bữa trưa",
    startTime: "12:00",
    endTime: "13:00",
    icon: Soup,
  },
  {
    type: "DINNER" as const,
    title: "Bữa tối",
    startTime: "19:00",
    endTime: "20:00",
    icon: UtensilsCrossed,
  },
  {
    type: "EXERCISE" as const,
    title: "Tập thể dục",
    startTime: "18:00",
    endTime: "18:45",
    icon: Dumbbell,
  },
];

function newRoutine(
  type: RoutineType = "PERSONAL",
  title = "Hoạt động mới",
  startTime = "18:00",
  endTime = "19:00",
): RoutineDraft {
  return {
    clientId:
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    type,
    title,
    weekdays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    startTime,
    endTime,
    isFlexible: false,
    constraintPriority: "HARD",
    priority: 3,
    minimumDurationMinutes: 30,
    preferredDurationMinutes: 60,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    notes: "",
  };
}

export default function RoutinesPage() {
  const router = useRouter();
  const routines = useOnboardingStore((state) => state.draft.routines);
  const addRoutine = useOnboardingStore((state) => state.addRoutine);
  const updateRoutine = useOnboardingStore((state) => state.updateRoutine);
  const removeRoutine = useOnboardingStore((state) => state.removeRoutine);
  const markSaved = useOnboardingStore((state) => state.markSaved);
  const [view, setView] = useState<"quick" | "timeline">("quick");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RoutineDraft | null>(null);
  const mutation = useMutation({
    mutationFn: () => onboardingApi.saveRoutines(routines),
    onSuccess: () => {
      markSaved();
      router.push("/onboarding/energy");
    },
  });

  const openNew = (routine: RoutineDraft) => {
    setEditing(routine);
    setEditorOpen(true);
  };
  const save = (routine: RoutineDraft) => {
    const exists = routines.some((item) => item.clientId === routine.clientId);
    if (exists) updateRoutine(routine.clientId, routine);
    else addRoutine(routine);
  };
  const remove = (routine: RoutineDraft) => {
    removeRoutine(routine.clientId);
    toast("Đã xóa hoạt động", {
      action: { label: "Hoàn tác", onClick: () => addRoutine(routine) },
    });
  };

  return (
    <StepCard
      title="Dành chỗ cho cuộc sống trước"
      description="Thêm các hoạt động lặp lại. Chúng sẽ được đặt lên lịch trước khi hệ thống tìm thời gian học."
    >
      {mutation.error ? (
        <InlineAlert tone="error">
          {isApiError(mutation.error)
            ? mutation.error.message
            : "Chưa thể lưu các hoạt động."}
        </InlineAlert>
      ) : null}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div
          className="bg-surface-muted flex rounded-xl p-1"
          aria-label="Chế độ hiển thị"
        >
          <Button
            variant={view === "quick" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setView("quick")}
          >
            <Sparkles className="size-4" /> Thiết lập nhanh
          </Button>
          <Button
            variant={view === "timeline" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setView("timeline")}
          >
            <List className="size-4" /> Dòng thời gian
          </Button>
        </div>
        <Button variant="secondary" onClick={() => openNew(newRoutine())}>
          <Plus className="size-4" /> Thêm hoạt động
        </Button>
      </div>

      {view === "quick" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map(({ icon: Icon, ...template }) => (
            <button
              key={template.type}
              type="button"
              onClick={() =>
                openNew(
                  newRoutine(
                    template.type,
                    template.title,
                    template.startTime,
                    template.endTime,
                  ),
                )
              }
              className="border-border bg-surface-muted hover:border-primary/45 focus-visible:ring-ring/35 rounded-[22px] border p-4 text-left transition outline-none hover:-translate-y-0.5 focus-visible:ring-3"
            >
              <span className="bg-surface text-primary-strong mb-3 grid size-10 place-items-center rounded-xl">
                <Icon className="size-5" />
              </span>
              <strong className="block">{template.title}</strong>
              <span className="text-muted-foreground mt-1 block text-xs">
                {template.startTime} – {template.endTime}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="border-border bg-surface-muted/50 overflow-hidden rounded-[22px] border">
          <div className="text-muted-foreground grid grid-cols-[4rem_1fr] border-b px-4 py-3 text-xs font-bold tracking-wide uppercase">
            <span>Giờ</span>
            <span>Hoạt động trong tuần</span>
          </div>
          {routines.length ? (
            [...routines]
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((routine) => (
                <button
                  key={routine.clientId}
                  type="button"
                  onClick={() => {
                    setEditing(routine);
                    setEditorOpen(true);
                  }}
                  className="border-border hover:bg-primary-soft focus-visible:bg-primary-soft grid w-full grid-cols-[4rem_1fr] border-b px-4 py-3 text-left outline-none last:border-0"
                >
                  <span className="text-primary-strong text-sm font-bold">
                    {routine.startTime}
                  </span>
                  <span>
                    <strong className="block text-sm">{routine.title}</strong>
                    <span className="text-muted-foreground mt-1 block text-xs">
                      {routine.endTime} ·{" "}
                      {routine.weekdays
                        .map((day) => WEEKDAY_LABELS[day])
                        .join(", ")}
                    </span>
                  </span>
                </button>
              ))
          ) : (
            <p className="text-muted-foreground px-5 py-10 text-center text-sm">
              Chưa có hoạt động nào trên dòng thời gian.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 space-y-2">
        {routines.map((routine) => (
          <div
            key={routine.clientId}
            className={cn(
              "border-border flex items-center gap-3 rounded-2xl border p-3",
              routine.constraintPriority === "HARD"
                ? "bg-surface"
                : "bg-accent-soft/45",
            )}
          >
            <button
              type="button"
              onClick={() => {
                setEditing(routine);
                setEditorOpen(true);
              }}
              className="focus-visible:ring-ring/35 min-w-0 flex-1 rounded-xl text-left outline-none focus-visible:ring-3"
            >
              <strong className="block truncate text-sm">
                {routine.title}
              </strong>
              <span className="text-muted-foreground mt-1 block text-xs">
                {routine.startTime}–{routine.endTime} ·{" "}
                {routine.weekdays.length} ngày ·{" "}
                {routine.constraintPriority === "HARD"
                  ? "Cố định"
                  : "Linh hoạt"}
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Xóa ${routine.title}`}
              onClick={() => remove(routine)}
            >
              <Trash2 className="text-danger size-4" />
            </Button>
          </div>
        ))}
      </div>
      {!routines.length ? (
        <p className="text-muted-foreground mt-5 text-center text-sm">
          Bạn có thể tiếp tục nếu không có hoạt động lặp lại.
        </p>
      ) : null}
      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          loading={mutation.isPending}
          loadingLabel="Đang lưu thói quen…"
          onClick={() => mutation.mutate()}
        >
          Tiếp tục <ArrowRight className="size-4" />
        </Button>
      </div>
      {editing ? (
        <RoutineEditor
          key={editing.clientId}
          open={editorOpen}
          routine={editing}
          onOpenChange={setEditorOpen}
          onSave={save}
        />
      ) : null}
    </StepCard>
  );
}
