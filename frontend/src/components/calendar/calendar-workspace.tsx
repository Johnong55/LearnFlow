"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EventEditor } from "@/components/calendar/event-editor";
import { ScheduleBuilder } from "@/components/calendar/schedule-builder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DayOfWeek } from "@/features/onboarding/types";
import {
  calendarApi,
  type CalendarEventItem,
  type CalendarItem,
  type CreateCalendarEventInput,
} from "@/lib/api/calendar.api";
import { isApiError } from "@/lib/api/errors";
import { roadmapsApi } from "@/lib/api/roadmaps.api";
import { routinesApi } from "@/lib/api/routines.api";
import { localDateKey, timeLabel } from "@/lib/date/calendar";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils/cn";

const dayEnumByIndex: Record<number, DayOfWeek> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export function CalendarWorkspace() {
  const queryClient = useQueryClient();
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventItem | null>(
    null,
  );
  const [plannerOpen, setPlannerOpen] = useState(false);
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekKey = localDateKey(weekStart);
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  const calendar = useQuery({
    queryKey: queryKeys.calendar.week(weekKey),
    queryFn: ({ signal }) => calendarApi.week(weekKey, signal),
  });
  const routines = useQuery({
    queryKey: queryKeys.routines.all,
    queryFn: ({ signal }) => routinesApi.list(signal),
  });
  const roadmaps = useQuery({
    queryKey: queryKeys.roadmaps.all,
    queryFn: ({ signal }) => roadmapsApi.list(signal),
  });
  const roadmap =
    roadmaps.data?.find((item) => item.status === "ACTIVE") ??
    roadmaps.data?.[0];

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.calendar.week(weekKey),
    });
  };
  const save = useMutation({
    mutationFn: (input: CreateCalendarEventInput) =>
      editingEvent
        ? calendarApi.update(editingEvent.id, input)
        : calendarApi.create(input),
    onSuccess: async () => {
      toast.success(editingEvent ? "Sự kiện đã cập nhật" : "Sự kiện đã thêm");
      setEditorOpen(false);
      setEditingEvent(null);
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: () => calendarApi.delete(editingEvent!.id),
    onSuccess: async () => {
      toast.success("Sự kiện đã xóa");
      setEditorOpen(false);
      setEditingEvent(null);
      await refresh();
    },
  });
  const openCreate = (date = selectedDate) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setEditorOpen(true);
  };
  const openEdit = (event: CalendarEventItem) => {
    setEditingEvent(event);
    setSelectedDate(new Date(event.startAt));
    setEditorOpen(true);
  };
  const itemsForDay = (day: Date) =>
    calendar.data?.items.filter((item) =>
      isSameDay(new Date(item.startAt), day),
    ) ?? [];
  const routinesForDay = (day: Date) =>
    routines.data?.filter((routine) =>
      routine.weekdays.includes(dayEnumByIndex[day.getDay()]!),
    ) ?? [];
  const error = save.error ?? remove.error;

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-primary-strong text-sm font-semibold">
            Lịch sống và học tập
          </p>
          <h1 className="font-display mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Tuần của bạn, trong một góc nhìn.
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            Routine được bảo vệ trước; phiên học chỉ xuất hiện trong khoảng còn
            thực sự phù hợp.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => openCreate()}>
            <Plus className="size-4" /> Thêm sự kiện
          </Button>
          <Button disabled={!roadmap} onClick={() => setPlannerOpen(true)}>
            <Sparkles className="size-4" /> Xếp lịch học
          </Button>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Tuần trước"
            onClick={() => {
              const next = addDays(anchorDate, -7);
              setAnchorDate(next);
              setSelectedDate(startOfWeek(next, { weekStartsOn: 1 }));
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setAnchorDate(new Date());
              setSelectedDate(new Date());
            }}
          >
            Hôm nay
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Tuần sau"
            onClick={() => {
              const next = addDays(anchorDate, 7);
              setAnchorDate(next);
              setSelectedDate(startOfWeek(next, { weekStartsOn: 1 }));
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <h2 className="font-display text-xl font-bold">
          {format(weekStart, "dd/MM")} –{" "}
          {format(addDays(weekStart, 6), "dd/MM/yyyy")}
        </h2>
      </div>

      {calendar.isPending || routines.isPending ? (
        <Skeleton className="mt-5 h-[34rem]" />
      ) : calendar.isError || routines.isError ? (
        <Card className="mt-5 text-center">
          <p className="text-danger font-semibold">Không thể tải lịch tuần.</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              void calendar.refetch();
              void routines.refetch();
            }}
          >
            Thử lại
          </Button>
        </Card>
      ) : (
        <>
          <div className="mt-5 hidden grid-cols-7 gap-2 lg:grid">
            {days.map((day) => (
              <DayColumn
                key={day.toISOString()}
                day={day}
                selected={isSameDay(day, selectedDate)}
                items={itemsForDay(day)}
                routines={routinesForDay(day)}
                onSelect={() => setSelectedDate(day)}
                onCreate={() => openCreate(day)}
                onEdit={openEdit}
              />
            ))}
          </div>
          <div className="mt-5 lg:hidden">
            <div className="mb-3 grid grid-cols-7 gap-1">
              {days.map((day) => (
                <button
                  key={day.toISOString()}
                  type="button"
                  aria-pressed={isSameDay(day, selectedDate)}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "focus-visible:ring-ring/35 min-h-14 rounded-xl text-center text-xs outline-none focus-visible:ring-3",
                    isSameDay(day, selectedDate)
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-muted",
                  )}
                >
                  <span className="block font-semibold">
                    {format(day, "EEEEE", { locale: vi })}
                  </span>
                  <span className="mt-1 block text-sm font-bold">
                    {format(day, "dd")}
                  </span>
                </button>
              ))}
            </div>
            <DayAgenda
              day={selectedDate}
              items={itemsForDay(selectedDate)}
              routines={routinesForDay(selectedDate)}
              onEdit={openEdit}
              onCreate={() => openCreate(selectedDate)}
            />
          </div>
        </>
      )}

      {editorOpen ? (
        <EventEditor
          key={`${editingEvent?.id ?? "new"}-${selectedDate.toISOString()}`}
          open={editorOpen}
          event={editingEvent}
          initialDate={selectedDate}
          saving={save.isPending}
          deleting={remove.isPending}
          error={
            error
              ? isApiError(error)
                ? error.message
                : "Không thể lưu sự kiện."
              : null
          }
          onOpenChange={(open) => {
            setEditorOpen(open);
            if (!open) setEditingEvent(null);
          }}
          onSave={(input) => save.mutate(input)}
          {...(editingEvent ? { onDelete: () => remove.mutate() } : {})}
        />
      ) : null}
      {plannerOpen && roadmap ? (
        <ScheduleBuilder
          key={`${roadmap.id}-${weekKey}`}
          open={plannerOpen}
          roadmapId={roadmap.id}
          onOpenChange={setPlannerOpen}
          onGenerated={() => void refresh()}
        />
      ) : null}
    </div>
  );
}

type DayContentProps = {
  day: Date;
  items: CalendarItem[];
  routines: Awaited<ReturnType<typeof routinesApi.list>>;
  onEdit: (event: CalendarEventItem) => void;
  onCreate: () => void;
};

function DayColumn({
  day,
  selected,
  items,
  routines,
  onSelect,
  onEdit,
  onCreate,
}: DayContentProps & { selected: boolean; onSelect: () => void }) {
  return (
    <div
      className={cn(
        "border-border bg-surface min-h-[32rem] rounded-[22px] border p-2",
        selected && "border-primary/50",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="focus-visible:ring-ring/35 mb-2 w-full rounded-xl p-2 text-left outline-none focus-visible:ring-3"
      >
        <span className="text-muted-foreground block text-xs font-semibold capitalize">
          {format(day, "EEEE", { locale: vi })}
        </span>
        <strong
          className={cn(
            "font-display mt-1 grid size-8 place-items-center rounded-xl",
            isSameDay(day, new Date()) && "bg-primary text-primary-foreground",
          )}
        >
          {format(day, "dd")}
        </strong>
      </button>
      <div className="space-y-1.5">
        {routines.map((routine) => (
          <RoutineBlock
            key={routine.id}
            title={routine.title}
            start={routine.startTime}
            end={routine.endTime}
          />
        ))}
        {items.map((item) => (
          <CalendarBlock key={item.id} item={item} onEdit={onEdit} />
        ))}
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="text-muted-foreground hover:text-primary-strong mt-2 min-h-10 w-full rounded-xl text-xs"
      >
        + Thêm
      </button>
    </div>
  );
}

function DayAgenda({
  day,
  items,
  routines,
  onEdit,
  onCreate,
}: DayContentProps) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-bold capitalize">
            {format(day, "EEEE", { locale: vi })}
          </h3>
          <p className="text-muted-foreground text-xs">
            {format(day, "dd/MM/yyyy")}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={onCreate}>
          <Plus className="size-4" /> Thêm
        </Button>
      </div>
      <div className="space-y-2">
        {routines.map((routine) => (
          <RoutineBlock
            key={routine.id}
            title={routine.title}
            start={routine.startTime}
            end={routine.endTime}
          />
        ))}
        {items.map((item) => (
          <CalendarBlock key={item.id} item={item} onEdit={onEdit} />
        ))}
        {!items.length && !routines.length ? (
          <div className="py-10 text-center">
            <CalendarDays className="text-muted-foreground mx-auto size-8" />
            <p className="text-muted-foreground mt-2 text-sm">
              Ngày này chưa có hoạt động.
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function RoutineBlock({
  title,
  start,
  end,
}: {
  title: string;
  start: string;
  end: string;
}) {
  return (
    <div className="border-info/20 bg-info-soft text-info-foreground rounded-xl border p-2.5">
      <p className="truncate text-xs font-semibold">{title}</p>
      <p className="mt-1 text-[10px] opacity-75">
        {start}–{end} · routine
      </p>
    </div>
  );
}

function CalendarBlock({
  item,
  onEdit,
}: {
  item: CalendarItem;
  onEdit: (event: CalendarEventItem) => void;
}) {
  const learning = item.kind === "STUDY_SESSION";
  const title = learning ? item.task.title : item.title;
  return (
    <button
      type="button"
      disabled={learning}
      onClick={() => {
        if (!learning) onEdit(item);
      }}
      className={cn(
        "w-full rounded-xl border p-2.5 text-left",
        learning
          ? "border-primary/25 bg-primary-soft text-primary-strong"
          : "border-coral/20 bg-coral-soft text-coral-foreground hover:border-coral/45",
      )}
    >
      <p className="truncate text-xs font-semibold">{title}</p>
      <p className="mt-1 flex items-center gap-1 text-[10px] opacity-75">
        <Clock3 className="size-3" /> {timeLabel(item.startAt)}–
        {timeLabel(item.endAt)}
      </p>
    </button>
  );
}
