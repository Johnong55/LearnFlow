"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, endOfDay, startOfDay } from "date-fns";
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Route,
} from "lucide-react";
import { useMemo } from "react";

import { SessionActions } from "@/components/sessions/session-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { calendarApi, type StudySession } from "@/lib/api/calendar.api";
import { formatTime, localDateKey } from "@/lib/date/calendar";
import { queryKeys } from "@/lib/query/keys";

export function RoadmapDailyPlan({
  roadmapId,
  estimatedWeeks,
  onBuildSchedule,
}: {
  roadmapId: string;
  estimatedWeeks: number;
  onBuildSchedule: () => void;
}) {
  const queryClient = useQueryClient();
  const range = useMemo(() => {
    const today = new Date();
    return {
      from: startOfDay(today).toISOString(),
      to: endOfDay(
        addDays(today, Math.min(364, estimatedWeeks * 7)),
      ).toISOString(),
    };
  }, [estimatedWeeks]);
  const { from, to } = range;
  const calendar = useQuery({
    queryKey: queryKeys.calendar.range(from, to),
    queryFn: ({ signal }) => calendarApi.range(from, to, signal),
  });
  const sessions =
    calendar.data?.items.filter(
      (item): item is StudySession =>
        item.kind === "STUDY_SESSION" &&
        item.task.module?.milestone.version.roadmapId === roadmapId,
    ) ?? [];
  const grouped = sessions.reduce<Map<string, StudySession[]>>(
    (days, session) => {
      const key = localDateKey(new Date(session.startAt));
      const current = days.get(key) ?? [];
      current.push(session);
      days.set(key, current);
      return days;
    },
    new Map(),
  );
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: ["calendar"] });

  if (calendar.isPending) return <Skeleton className="h-[30rem]" />;
  if (calendar.isError)
    return (
      <Card className="text-center">
        <p className="text-danger font-semibold">
          Không thể tải kế hoạch theo ngày.
        </p>
        <Button
          variant="secondary"
          className="mt-3"
          onClick={() => void calendar.refetch()}
        >
          Thử lại
        </Button>
      </Card>
    );
  if (!sessions.length)
    return (
      <Card className="grid min-h-80 place-items-center text-center">
        <div>
          <span className="bg-primary-soft text-primary-strong mx-auto grid size-16 place-items-center rounded-3xl">
            <CalendarPlus className="size-8" />
          </span>
          <h2 className="font-display mt-5 text-3xl font-bold">
            Roadmap chưa được chia theo ngày
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm leading-6">
            Scheduler sẽ phân tích công việc, giấc ngủ, routine, giới hạn học
            mỗi ngày và dependency để quyết định chính xác ngày nào học task
            nào.
          </p>
          <Button className="mt-6" onClick={onBuildSchedule}>
            <CalendarClock className="size-4" /> Phân tích và lập lịch theo ngày
          </Button>
        </div>
      </Card>
    );

  return (
    <div className="space-y-5">
      {[...grouped.entries()].map(([date, daySessions], dayIndex) => {
        const dateValue = new Date(`${date}T12:00:00`);
        const completed = daySessions.filter(
          (session) => session.status === "COMPLETED",
        ).length;
        return (
          <section key={date} className="grid gap-4 lg:grid-cols-[10rem_1fr]">
            <div className="lg:pt-4">
              <span className="text-primary-strong text-xs font-bold tracking-wide uppercase">
                Ngày {dayIndex + 1}
              </span>
              <h2 className="font-display mt-1 text-xl font-bold">
                {new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(
                  dateValue,
                )}
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                {new Intl.DateTimeFormat("vi-VN", {
                  day: "numeric",
                  month: "long",
                }).format(dateValue)}
              </p>
              <span className="text-success mt-3 inline-flex items-center gap-1 text-xs font-semibold">
                <CheckCircle2 className="size-3.5" /> {completed}/
                {daySessions.length} hoàn thành
              </span>
            </div>
            <Card className="space-y-3 p-4 sm:p-5">
              {daySessions.map((session, sessionIndex) => (
                <article
                  key={session.id}
                  className="border-border bg-surface-muted/55 rounded-[20px] border p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="bg-primary-deep text-primary font-display grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold">
                      {sessionIndex + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">
                            {session.task.title}
                          </h3>
                          <p className="text-muted-foreground mt-1 text-sm leading-6">
                            {session.task.description ||
                              "Hoàn thành nội dung và ghi lại điều đã hiểu."}
                          </p>
                        </div>
                        <span className="bg-surface flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
                          <Clock3 className="size-3" />{" "}
                          {formatTime(session.startAt)}–
                          {formatTime(session.endAt)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                        <span className="bg-primary-soft text-primary-strong rounded-full px-2.5 py-1">
                          {session.plannedMinutes} phút
                        </span>
                        <span className="bg-surface rounded-full px-2.5 py-1">
                          {session.task.difficulty}
                        </span>
                        <span className="bg-surface rounded-full px-2.5 py-1">
                          {session.status}
                        </span>
                      </div>
                      <div className="mt-4">
                        <SessionActions session={session} onChanged={refresh} />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </Card>
          </section>
        );
      })}
      <div className="flex justify-center pt-3">
        <Button variant="secondary" onClick={onBuildSchedule}>
          <Route className="size-4" /> Cân bằng lại kế hoạch
        </Button>
      </div>
    </div>
  );
}
