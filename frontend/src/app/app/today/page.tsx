"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Coffee,
  Play,
  Route,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { SessionFocusDialog } from "@/components/calendar/session-focus-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WEEKDAYS } from "@/features/onboarding/types";
import { calendarApi, type StudySessionItem } from "@/lib/api/calendar.api";
import { isApiError } from "@/lib/api/errors";
import { routinesApi } from "@/lib/api/routines.api";
import { sessionsApi } from "@/lib/api/sessions.api";
import { localDateKey, timeLabel } from "@/lib/date/calendar";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth-store";

type ActionInput = {
  session: StudySessionItem;
  action: "start" | "pause" | "skip" | "complete";
  actualMinutes?: number;
  notes?: string;
  openFocusAfter?: boolean;
};

export default function TodayPage() {
  const today = new Date();
  const dateKey = localDateKey(today);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [focusSession, setFocusSession] = useState<StudySessionItem | null>(
    null,
  );
  const calendar = useQuery({
    queryKey: queryKeys.calendar.day(dateKey),
    queryFn: ({ signal }) => calendarApi.day(dateKey, signal),
  });
  const routines = useQuery({
    queryKey: queryKeys.routines.all,
    queryFn: ({ signal }) => routinesApi.list(signal),
  });
  const sessions =
    calendar.data?.items.filter(
      (item): item is StudySessionItem => item.kind === "STUDY_SESSION",
    ) ?? [];
  const next = sessions.find(
    (session) =>
      !["COMPLETED", "SKIPPED", "MISSED", "CANCELLED"].includes(session.status),
  );
  const plannedMinutes = sessions
    .filter((session) => !["CANCELLED", "SKIPPED"].includes(session.status))
    .reduce((sum, session) => sum + session.plannedMinutes, 0);
  const completed = sessions.filter(
    (session) => session.status === "COMPLETED",
  ).length;
  const dayEnum = WEEKDAYS[(today.getDay() + 6) % 7]!;
  const todayRoutines =
    routines.data?.filter((routine) => routine.weekdays.includes(dayEnum)) ??
    [];

  const action = useMutation({
    mutationFn: async (input: ActionInput) => {
      if (input.action === "start") return sessionsApi.start(input.session.id);
      if (input.action === "pause") return sessionsApi.pause(input.session.id);
      if (input.action === "skip")
        return sessionsApi.skip(input.session.id, {
          reason: "Người dùng bỏ qua từ Today",
          reschedulingMode: "BALANCED",
        });
      return sessionsApi.complete(input.session.id, {
        actualMinutes: input.actualMinutes ?? input.session.plannedMinutes,
        ...(input.notes ? { notes: input.notes } : {}),
      });
    },
    onSuccess: async (_data, input) => {
      toast.success(
        input.action === "complete"
          ? "Đã hoàn thành phiên học"
          : input.action === "skip"
            ? "Phiên học sẽ được xếp lại"
            : input.action === "pause"
              ? "Đã tạm dừng"
              : "Đã bắt đầu phiên học",
      );
      if (input.action === "start" && input.openFocusAfter) {
        setFocusSession({ ...input.session, status: "IN_PROGRESS" });
      } else {
        setFocusSession(null);
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.calendar.day(dateKey),
      });
    },
    onError: (error) =>
      toast.error(
        isApiError(error) ? error.message : "Không thể cập nhật phiên học.",
      ),
  });

  const firstName =
    user?.profile?.fullName?.trim().split(/\s+/).at(-1) ?? "bạn";

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary-strong text-sm font-semibold capitalize">
            {format(today, "EEEE, dd MMMM", { locale: vi })}
          </p>
          <h1 className="font-display mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Hôm nay của {firstName}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl leading-7">
            Một ngày cân bằng không cần kín lịch. Hãy tập trung vào phiên quan
            trọng tiếp theo.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/app/calendar">
            <CalendarPlus className="size-4" /> Thêm sự kiện
          </Link>
        </Button>
      </div>

      {calendar.isPending || routines.isPending ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : calendar.isError ? (
        <Card className="mt-8 text-center">
          <p className="text-danger font-semibold">
            Không thể tải lịch hôm nay.
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => void calendar.refetch()}
          >
            Thử lại
          </Button>
        </Card>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Card
            className={cn(
              "overflow-hidden p-0",
              next ? "bg-primary-deep text-background" : "bg-surface",
            )}
          >
            <div className="p-7 sm:p-8">
              {next ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="bg-primary/20 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold">
                      <Sparkles className="size-3.5" /> Phiên tiếp theo
                    </span>
                    <span className="text-sm opacity-70">
                      {timeLabel(next.startAt)}–{timeLabel(next.endAt)}
                    </span>
                  </div>
                  <p className="text-primary mt-6 text-xs font-bold tracking-[0.12em] uppercase">
                    {next.task.module?.milestone?.title ?? "Phiên học hôm nay"}
                  </p>
                  <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">
                    {next.task.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 opacity-70">
                    {next.task.description}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-sm">
                    <Clock3 className="text-primary size-4" />{" "}
                    {next.plannedMinutes} phút · {next.task.difficulty}
                  </div>
                  <Button
                    size="lg"
                    className="mt-7"
                    onClick={() => {
                      if (next.status === "IN_PROGRESS") {
                        setFocusSession(next);
                      } else {
                        action.mutate({
                          session: next,
                          action: "start",
                          openFocusAfter: true,
                        });
                      }
                    }}
                  >
                    <Play className="size-4" />{" "}
                    {next.status === "IN_PROGRESS"
                      ? "Quay lại focus"
                      : next.status === "PAUSED"
                        ? "Tiếp tục phiên"
                        : "Bắt đầu phiên"}
                  </Button>
                </>
              ) : (
                <div className="grid min-h-60 place-items-center text-center">
                  <div>
                    <CheckCircle2 className="text-success mx-auto size-12" />
                    <h2 className="font-display mt-4 text-3xl font-bold">
                      Không còn phiên học hôm nay
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Hãy nghỉ ngơi hoặc xem trước tuần tiếp theo.
                    </p>
                    <Button asChild variant="secondary" className="mt-5">
                      <Link href="/app/calendar">Mở lịch tuần</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="bg-info-soft text-info grid size-10 place-items-center rounded-xl">
                  <Clock3 className="size-5" />
                </span>
                <strong className="font-display text-2xl">
                  {plannedMinutes}
                </strong>
              </div>
              <p className="mt-3 text-sm font-semibold">Phút học đã lên lịch</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {completed}/{sessions.length} phiên hoàn thành
              </p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="bg-accent-soft text-warning grid size-10 place-items-center rounded-xl">
                  <Coffee className="size-5" />
                </span>
                <strong className="font-display text-2xl">
                  {todayRoutines.length}
                </strong>
              </div>
              <p className="mt-3 text-sm font-semibold">Routine được bảo vệ</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Công việc, ngủ, ăn uống và thời gian cá nhân
              </p>
            </Card>
          </div>
        </div>
      )}

      <Card className="mt-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">
              Dòng thời gian hôm nay
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Tất cả thời gian hiển thị theo múi giờ thiết bị.
            </p>
          </div>
          <Route className="text-primary size-6" />
        </div>
        <div className="space-y-2">
          {[
            ...todayRoutines.map((routine) => ({
              id: routine.id,
              start: routine.startTime,
              end: routine.endTime,
              title: routine.title,
              kind: "ROUTINE" as const,
              status: routine.constraintPriority,
            })),
            ...(calendar.data?.items ?? []).map((item) => ({
              id: item.id,
              start: timeLabel(item.startAt),
              end: timeLabel(item.endAt),
              title:
                item.kind === "STUDY_SESSION" ? item.task.title : item.title,
              kind: item.kind,
              status: item.kind === "STUDY_SESSION" ? item.status : item.type,
            })),
          ]
            .sort((a, b) => a.start.localeCompare(b.start))
            .map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="border-border flex items-center gap-4 rounded-2xl border p-4"
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    item.kind === "STUDY_SESSION"
                      ? "bg-primary-soft text-primary-strong"
                      : item.kind === "ROUTINE"
                        ? "bg-info-soft text-info"
                        : "bg-coral-soft text-coral",
                  )}
                >
                  {item.kind === "STUDY_SESSION" ? (
                    <Route className="size-4" />
                  ) : (
                    <Coffee className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {item.start}–{item.end}
                  </p>
                </div>
                <span className="text-muted-foreground text-[10px] font-bold">
                  {item.status}
                </span>
              </div>
            ))}
        </div>
      </Card>
      {focusSession ? (
        <SessionFocusDialog
          key={`${focusSession.id}-${focusSession.status}`}
          open
          session={focusSession}
          pending={action.isPending}
          onOpenChange={(open) => {
            if (!open) setFocusSession(null);
          }}
          onAction={(input) =>
            action.mutate({
              session: focusSession,
              ...input,
              ...(input.action === "start" ? { openFocusAfter: true } : {}),
            })
          }
        />
      ) : null}
    </div>
  );
}
