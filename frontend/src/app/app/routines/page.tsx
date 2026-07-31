"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, List, Plus, Rows3, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { RoutineEditor } from "@/components/onboarding/routine-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RoutineDraft, RoutineType } from "@/features/onboarding/types";
import { WEEKDAY_LABELS } from "@/features/onboarding/types";
import { isApiError } from "@/lib/api/errors";
import {
  routinesApi,
  type Routine,
  type RoutineInput,
} from "@/lib/api/routines.api";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils/cn";

function newRoutine(
  type: RoutineType = "PERSONAL",
  title = "Hoạt động mới",
): RoutineDraft {
  return {
    clientId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    type,
    title,
    weekdays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    startTime: "18:00",
    endTime: "19:00",
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

function toDraft(routine: Routine): RoutineDraft {
  const type = routine.type;
  if (type === "SLEEP" || type === "WORK") throw new Error("SYSTEM_ROUTINE");
  return {
    clientId: routine.id,
    type,
    title: routine.title,
    weekdays: routine.weekdays,
    startTime: routine.startTime,
    endTime: routine.endTime,
    isFlexible: routine.isFlexible,
    constraintPriority: routine.constraintPriority,
    priority: routine.priority,
    minimumDurationMinutes: routine.minimumDurationMinutes ?? 30,
    preferredDurationMinutes: routine.preferredDurationMinutes ?? 60,
    bufferBeforeMinutes: routine.bufferBeforeMinutes,
    bufferAfterMinutes: routine.bufferAfterMinutes,
    notes: "",
  };
}

function toInput(routine: RoutineDraft): RoutineInput {
  return {
    type: routine.type,
    title: routine.title,
    weekdays: routine.weekdays,
    startTime: routine.startTime,
    endTime: routine.endTime,
    isFlexible: routine.isFlexible,
    constraintPriority: routine.constraintPriority,
    priority: routine.priority,
    minimumDurationMinutes: routine.minimumDurationMinutes,
    preferredDurationMinutes: routine.preferredDurationMinutes,
    bufferBeforeMinutes: routine.bufferBeforeMinutes,
    bufferAfterMinutes: routine.bufferAfterMinutes,
  };
}

export default function RoutinesManagementPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "timeline">("list");
  const [editing, setEditing] = useState<RoutineDraft | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const routines = useQuery({
    queryKey: queryKeys.routines.all,
    queryFn: ({ signal }) => routinesApi.list(signal),
  });
  const save = useMutation({
    mutationFn: (draft: RoutineDraft) =>
      routines.data?.some((item) => item.id === draft.clientId)
        ? routinesApi.update(draft.clientId, toInput(draft))
        : routinesApi.create(toInput(draft)),
    onSuccess: async () => {
      toast.success("Routine đã được lưu");
      await queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
    onError: (error) =>
      toast.error(isApiError(error) ? error.message : "Không thể lưu routine."),
  });
  const remove = useMutation({
    mutationFn: (id: string) => routinesApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.routines.all });
      const previous = queryClient.getQueryData<Routine[]>(
        queryKeys.routines.all,
      );
      queryClient.setQueryData<Routine[]>(queryKeys.routines.all, (current) =>
        current?.filter((item) => item.id !== id),
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKeys.routines.all, context.previous);
      toast.error(isApiError(error) ? error.message : "Không thể xóa routine.");
    },
    onSuccess: () => toast.success("Routine đã xóa"),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
  });
  const openNew = (draft = newRoutine()) => {
    setEditing(draft);
    setEditorOpen(true);
  };
  const openEdit = (routine: Routine) => {
    if (routine.type === "SLEEP" || routine.type === "WORK") {
      toast.info("Giờ ngủ và làm việc được chỉnh trong onboarding.");
      return;
    }
    setEditing(toDraft(routine));
    setEditorOpen(true);
  };
  const duplicate = (routine: Routine) => {
    if (routine.type === "SLEEP" || routine.type === "WORK") {
      toast.info("Routine hệ thống không thể nhân bản.");
      return;
    }
    openNew({
      ...toDraft(routine),
      clientId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      title: `${routine.title} (bản sao)`,
    });
  };

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary-strong text-sm font-semibold">
            Nhịp sống lặp lại
          </p>
          <h1 className="font-display mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Bảo vệ điều quan trọng mỗi ngày.
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            Routine cố định là ranh giới cứng của scheduler. Routine linh hoạt
            giúp tối ưu lịch nhưng vẫn tôn trọng thời lượng.
          </p>
        </div>
        <Button onClick={() => openNew()}>
          <Plus className="size-4" /> Thêm routine
        </Button>
      </div>
      <div className="mt-7 flex items-center justify-between gap-3">
        <div className="bg-surface-muted flex rounded-xl p-1">
          <Button
            size="sm"
            variant={view === "list" ? "primary" : "ghost"}
            onClick={() => setView("list")}
          >
            <List className="size-4" /> Danh sách
          </Button>
          <Button
            size="sm"
            variant={view === "timeline" ? "primary" : "ghost"}
            onClick={() => setView("timeline")}
          >
            <Rows3 className="size-4" /> Timeline
          </Button>
        </div>
        <span className="text-muted-foreground text-xs">
          {routines.data?.length ?? 0} hoạt động
        </span>
      </div>
      {routines.isPending ? (
        <Skeleton className="mt-5 h-96" />
      ) : routines.isError ? (
        <Card className="mt-5 text-center">
          <p className="text-danger font-semibold">Không thể tải routine.</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => void routines.refetch()}
          >
            Thử lại
          </Button>
        </Card>
      ) : !routines.data?.length ? (
        <Card className="mt-5 grid min-h-80 place-items-center text-center">
          <div>
            <ShieldCheck className="text-primary mx-auto size-12" />
            <h2 className="font-display mt-4 text-3xl font-bold">
              Chưa có routine
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Thêm giờ ngủ, làm việc, ăn uống hoặc thời gian gia đình.
            </p>
            <Button className="mt-5" onClick={() => openNew()}>
              Thêm hoạt động đầu tiên
            </Button>
          </div>
        </Card>
      ) : view === "list" ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {routines.data.map((routine) => (
            <Card key={routine.id} className="p-5">
              <div className="flex items-start gap-4">
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-2xl",
                    routine.constraintPriority === "HARD"
                      ? "bg-info-soft text-info"
                      : "bg-accent-soft text-warning",
                  )}
                >
                  <ShieldCheck className="size-5" />
                </span>
                <button
                  type="button"
                  onClick={() => openEdit(routine)}
                  className="focus-visible:ring-ring/35 min-w-0 flex-1 rounded-xl text-left outline-none focus-visible:ring-3"
                >
                  <h2 className="truncate font-semibold">{routine.title}</h2>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {routine.startTime}–{routine.endTime} ·{" "}
                    {routine.weekdays
                      .map((day) => WEEKDAY_LABELS[day])
                      .join(", ")}
                  </p>
                  <span className="bg-surface-muted mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold">
                    {routine.constraintPriority === "HARD"
                      ? "Cố định"
                      : "Linh hoạt"}
                  </span>
                </button>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Nhân bản ${routine.title}`}
                    onClick={() => duplicate(routine)}
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Xóa ${routine.title}`}
                    onClick={() => remove.mutate(routine.id)}
                  >
                    <Trash2 className="text-danger size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-5 p-4 sm:p-6">
          <div className="space-y-2">
            {[...routines.data]
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((routine) => (
                <button
                  key={routine.id}
                  type="button"
                  onClick={() => openEdit(routine)}
                  className="border-border hover:border-primary/40 grid w-full grid-cols-[4rem_1fr_auto] items-center gap-3 rounded-2xl border p-3 text-left"
                >
                  <strong className="text-primary-strong text-sm">
                    {routine.startTime}
                  </strong>
                  <span>
                    <span className="block text-sm font-semibold">
                      {routine.title}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-xs">
                      đến {routine.endTime} · {routine.weekdays.length} ngày
                    </span>
                  </span>
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      routine.constraintPriority === "HARD"
                        ? "bg-info"
                        : "bg-warning",
                    )}
                  />
                </button>
              ))}
          </div>
        </Card>
      )}
      {editing ? (
        <RoutineEditor
          key={editing.clientId}
          open={editorOpen}
          routine={editing}
          onOpenChange={setEditorOpen}
          onSave={(draft) => save.mutate(draft)}
        />
      ) : null}
    </div>
  );
}
