"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  MoonStar,
  Plus,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { EventEditor } from "@/components/calendar/event-editor";
import { ScheduleBuilder } from "@/components/calendar/schedule-builder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buildDayEntries } from "@/features/calendar/day-entries";
import {
  buildTimelineBlocks,
  type TimelineBlock,
} from "@/features/calendar/week-timeline";
import type { DayOfWeek } from "@/features/onboarding/types";
import {
  calendarApi,
  type CalendarEventItem,
  type CalendarItem,
  type CreateCalendarEventInput,
} from "@/lib/api/calendar.api";
import { isApiError } from "@/lib/api/errors";
import { roadmapsApi } from "@/lib/api/roadmaps.api";
import { routinesApi, type Routine } from "@/lib/api/routines.api";
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

const TIMELINE_HOUR_HEIGHT = 52;
const TIMELINE_MINUTE_HEIGHT = TIMELINE_HOUR_HEIGHT / 60;
const TIMELINE_TOTAL_HEIGHT = TIMELINE_HOUR_HEIGHT * 24;
const TIMELINE_INITIAL_HOUR = 5;

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
          <WeekTimeline
            days={days}
            selectedDate={selectedDate}
            items={calendar.data?.items ?? []}
            routines={routines.data ?? []}
            onSelect={setSelectedDate}
            onCreate={openCreate}
            onEdit={openEdit}
          />
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

function WeekTimeline({
  days,
  selectedDate,
  items,
  routines,
  onSelect,
  onCreate,
  onEdit,
}: {
  days: Date[];
  selectedDate: Date;
  items: CalendarItem[];
  routines: Awaited<ReturnType<typeof routinesApi.list>>;
  onSelect: (day: Date) => void;
  onCreate: (day: Date) => void;
  onEdit: (event: CalendarEventItem) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: 24 }, (_, hour) => hour);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTop = TIMELINE_INITIAL_HOUR * TIMELINE_HOUR_HEIGHT;
  }, []);

  return (
    <>
      <div className="text-muted-foreground mt-4 hidden flex-wrap items-center gap-x-5 gap-y-2 text-xs lg:flex">
        <span className="inline-flex items-center gap-2">
          <span className="border-info/40 bg-info-soft/25 size-3 rounded border border-dashed" />
          Thời gian được bảo vệ
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="bg-primary-soft border-primary/40 size-3 rounded border" />
          Phiên học
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="bg-accent-soft border-accent/40 size-3 rounded border" />
          Sinh hoạt
        </span>
        <span className="inline-flex items-center gap-2">
          <CircleAlert className="text-warning size-3.5" aria-hidden="true" />
          Cần xếp lại
        </span>
        <span className="ml-auto">
          Di chuột hoặc chọn một block để xem đầy đủ
        </span>
      </div>
      <div
        ref={scrollContainerRef}
        className="border-border bg-surface mt-3 hidden max-h-[72vh] overflow-auto rounded-[24px] border lg:block"
      >
        <div className="min-w-[72rem]">
          <div className="border-border bg-surface sticky top-0 z-30 grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))] border-b">
            <div className="text-muted-foreground flex items-center justify-center text-[10px] font-semibold">
              Giờ
            </div>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "border-border focus-visible:ring-ring/35 flex min-h-16 items-center justify-between border-l px-3 text-left outline-none focus-visible:ring-3",
                  isSameDay(day, selectedDate) && "bg-primary-soft/60",
                )}
              >
                <button
                  type="button"
                  aria-pressed={isSameDay(day, selectedDate)}
                  onClick={() => onSelect(day)}
                  className="focus-visible:ring-ring/35 min-w-0 flex-1 rounded-xl text-left outline-none focus-visible:ring-3"
                >
                  <span className="text-muted-foreground block text-[10px] font-semibold capitalize">
                    {format(day, "EEEE", { locale: vi })}
                  </span>
                  <strong className="font-display mt-1 block text-lg">
                    {format(day, "dd")}
                  </strong>
                </button>
                <button
                  type="button"
                  onClick={() => onCreate(day)}
                  className="text-muted-foreground hover:bg-surface-muted focus-visible:ring-ring/35 grid size-8 place-items-center rounded-xl outline-none focus-visible:ring-3"
                  aria-label={`Thêm sự kiện ${format(day, "dd/MM")}`}
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))]">
            <div className="relative" style={{ height: TIMELINE_TOTAL_HEIGHT }}>
              {hours.map((hour) => (
                <span
                  key={hour}
                  className="text-muted-foreground absolute right-3 -translate-y-1/2 text-[10px] tabular-nums"
                  style={{ top: hour * TIMELINE_HOUR_HEIGHT }}
                >
                  {String(hour).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            {days.map((day) => (
              <TimelineDay
                key={day.toISOString()}
                day={day}
                selected={isSameDay(day, selectedDate)}
                blocks={buildTimelineBlocks(day, routines, items)}
                tooltipAlign={
                  day === days[0]
                    ? "start"
                    : day === days.at(-1)
                      ? "end"
                      : "center"
                }
                onCreate={() => onCreate(day)}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function TimelineDay({
  day,
  selected,
  blocks,
  tooltipAlign,
  onCreate,
  onEdit,
}: {
  day: Date;
  selected: boolean;
  blocks: TimelineBlock[];
  tooltipAlign: "start" | "center" | "end";
  onCreate: () => void;
  onEdit: (event: CalendarEventItem) => void;
}) {
  const now = new Date();
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  return (
    <div
      className={cn(
        "calendar-hour-grid border-border relative border-l",
        selected && "bg-primary-soft/15",
      )}
      style={{
        height: TIMELINE_TOTAL_HEIGHT,
        backgroundSize: `100% ${TIMELINE_HOUR_HEIGHT}px`,
      }}
      onDoubleClick={onCreate}
    >
      {blocks.map((block) => {
        const protectedBy = findOverlappingProtectedRoutine(block, blocks);
        return (
          <TimelineEvent
            key={block.key}
            block={block}
            protectedBy={protectedBy}
            tooltipAlign={tooltipAlign}
            onEdit={onEdit}
          />
        );
      })}
      {isSameDay(day, now) ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-20 border-t border-[var(--coral)]"
          style={{ top: currentMinute * TIMELINE_MINUTE_HEIGHT }}
        >
          <span className="absolute -top-1.5 -left-1 size-3 rounded-full bg-[var(--coral)]" />
        </div>
      ) : null}
    </div>
  );
}

function isProtectedRoutine(routine: Routine): boolean {
  return routine.type === "WORK" || routine.type === "SLEEP";
}

function findOverlappingProtectedRoutine(
  block: TimelineBlock,
  blocks: TimelineBlock[],
): Routine | null {
  if (block.kind === "ROUTINE" && isProtectedRoutine(block.routine)) {
    return null;
  }

  const protectedBlock = blocks.find(
    (candidate) =>
      candidate.kind === "ROUTINE" &&
      isProtectedRoutine(candidate.routine) &&
      block.startMinute < candidate.endMinute &&
      block.endMinute > candidate.startMinute,
  );

  return protectedBlock?.kind === "ROUTINE" ? protectedBlock.routine : null;
}

function TimelineEvent({
  block,
  protectedBy,
  tooltipAlign,
  onEdit,
}: {
  block: TimelineBlock;
  protectedBy: Routine | null;
  tooltipAlign: "start" | "center" | "end";
  onEdit: (event: CalendarEventItem) => void;
}) {
  const duration = block.endMinute - block.startMinute;
  const visualHeight = duration * TIMELINE_MINUTE_HEIGHT;
  const tooltipAbove = block.startMinute >= 18 * 60;
  if (block.kind === "ROUTINE") {
    const protectedTime = isProtectedRoutine(block.routine);
    const startLabel = block.continuation ? "00:00" : block.routine.startTime;
    const endLabel = block.endMinute === 1440 ? "24:00" : block.routine.endTime;
    const protectedIcon =
      block.routine.type === "SLEEP" ? (
        <MoonStar className="size-3 shrink-0" aria-hidden="true" />
      ) : (
        <BriefcaseBusiness className="size-3 shrink-0" aria-hidden="true" />
      );

    if (protectedTime) {
      return (
        <div
          data-testid={`timeline-${block.key}`}
          className="border-info/30 bg-info-soft/20 text-info-foreground pointer-events-none absolute z-[1] overflow-hidden rounded-xl border border-dashed text-left"
          style={{
            top: block.startMinute * TIMELINE_MINUTE_HEIGHT,
            height: Math.max(28, visualHeight),
            left: 4,
            right: 4,
          }}
          title={`${block.routine.title} · ${startLabel}–${endLabel}`}
        >
          <div className="border-info/20 bg-info-soft/70 absolute inset-y-1 left-1 flex w-5 flex-col items-center gap-1 overflow-hidden rounded-md border py-1">
            {protectedIcon}
            <span className="overflow-hidden text-[8px] font-bold tracking-[0.12em] uppercase opacity-70 [writing-mode:vertical-rl]">
              {block.routine.title}
            </span>
          </div>
          <span className="sr-only">
            {block.routine.title}, {startLabel} đến {endLabel}, thời gian được
            bảo vệ
          </span>
        </div>
      );
    }

    const tooltipId = `timeline-detail-${block.key}`;
    return (
      <button
        type="button"
        data-testid={`timeline-${block.key}`}
        aria-label={`Xem ${block.routine.title}, ${startLabel} đến ${endLabel}`}
        aria-describedby={tooltipId}
        className={cn(
          "group focus-visible:ring-ring/50 absolute z-[3] rounded-lg border px-2 py-1 text-left shadow-sm outline-none hover:z-30 focus:z-30 focus-visible:ring-2",
          block.routine.type === "BREAKFAST" ||
            block.routine.type === "LUNCH" ||
            block.routine.type === "DINNER"
            ? "border-accent/40 bg-accent-soft text-accent-foreground"
            : block.routine.type === "EXERCISE"
              ? "border-primary/35 bg-primary-soft text-primary-strong"
              : "border-coral/30 bg-coral-soft text-coral-foreground",
        )}
        style={{
          top: block.startMinute * TIMELINE_MINUTE_HEIGHT,
          height: Math.max(24, visualHeight),
          left: protectedBy ? 30 : 8,
          right: 7,
        }}
      >
        <span className="block truncate text-[10px] leading-3.5 font-semibold">
          {visualHeight < 38 ? (
            <span className="font-normal tabular-nums opacity-70">
              {startLabel} ·{" "}
            </span>
          ) : null}
          {block.routine.title}
        </span>
        {visualHeight >= 38 ? (
          <span className="mt-0.5 block truncate text-[8px] leading-3 tabular-nums opacity-70">
            {startLabel}–{endLabel}
          </span>
        ) : null}
        <TimelineTooltip
          id={tooltipId}
          title={block.routine.title}
          time={`${startLabel}–${endLabel}`}
          detail={protectedBy ? `Nằm trong ${protectedBy.title}` : "Sinh hoạt"}
          align={tooltipAlign}
          above={tooltipAbove}
        />
      </button>
    );
  }

  const item = block.item;
  if (item.kind === "STUDY_SESSION") {
    const tooltipId = `timeline-detail-${block.key}`;
    const hasProtectedConflict = Boolean(protectedBy);
    return (
      <button
        type="button"
        aria-label={`Xem phiên học ${item.task.title}`}
        aria-describedby={tooltipId}
        className={cn(
          "group focus-visible:ring-ring/50 absolute z-[5] rounded-lg border px-2 py-1 text-left shadow-md outline-none hover:z-30 focus:z-30 focus-visible:ring-2",
          hasProtectedConflict
            ? "border-warning/70 bg-warning/15 text-foreground"
            : "border-primary/30 bg-primary-soft text-primary-strong",
        )}
        style={{
          top: block.startMinute * TIMELINE_MINUTE_HEIGHT,
          height: Math.max(24, visualHeight),
          left: protectedBy ? 30 : 12,
          right: 4,
        }}
      >
        <span
          className={cn(
            "block truncate text-[10px] leading-3.5 font-semibold",
            hasProtectedConflict && "pr-4",
          )}
        >
          {visualHeight < 38 ? (
            <span className="font-normal tabular-nums opacity-70">
              {timeLabel(item.startAt)} ·{" "}
            </span>
          ) : null}
          {item.task.title}
        </span>
        {hasProtectedConflict ? (
          <CircleAlert
            className="text-warning absolute top-1 right-1 size-3.5"
            aria-hidden="true"
          />
        ) : null}
        {visualHeight >= 38 ? (
          <span className="mt-0.5 flex items-center gap-1 truncate text-[8px] leading-3 tabular-nums opacity-70">
            <Clock3 className="size-2.5" /> {timeLabel(item.startAt)}–
            {timeLabel(item.endAt)}
          </span>
        ) : null}
        <TimelineTooltip
          id={tooltipId}
          title={item.task.title}
          time={`${timeLabel(item.startAt)}–${timeLabel(item.endAt)}`}
          detail={
            protectedBy
              ? `Xung đột với ${protectedBy.title}. Phiên học cần được xếp lại.`
              : "Phiên học"
          }
          warning={hasProtectedConflict}
          align={tooltipAlign}
          above={tooltipAbove}
        />
      </button>
    );
  }

  const tooltipId = `timeline-detail-${block.key}`;
  return (
    <button
      type="button"
      onClick={() => onEdit(item)}
      aria-label={`Chỉnh sửa ${item.title}`}
      aria-describedby={tooltipId}
      className="border-coral/30 bg-coral-soft text-coral-foreground hover:border-coral/60 group focus-visible:ring-ring/50 absolute z-[4] rounded-lg border px-2 py-1 text-left shadow-md outline-none hover:z-30 focus:z-30 focus-visible:ring-2"
      style={{
        top: block.startMinute * TIMELINE_MINUTE_HEIGHT,
        height: Math.max(24, visualHeight),
        left: protectedBy ? 30 : 12,
        right: 4,
      }}
    >
      <span className="block truncate text-[10px] leading-3.5 font-semibold">
        {visualHeight < 38 ? (
          <span className="font-normal tabular-nums opacity-70">
            {timeLabel(item.startAt)} ·{" "}
          </span>
        ) : null}
        {item.title}
      </span>
      {visualHeight >= 38 ? (
        <span className="mt-0.5 flex items-center gap-1 truncate text-[8px] leading-3 tabular-nums opacity-70">
          <Clock3 className="size-2.5" /> {timeLabel(item.startAt)}–
          {timeLabel(item.endAt)}
        </span>
      ) : null}
      <TimelineTooltip
        id={tooltipId}
        title={item.title}
        time={`${timeLabel(item.startAt)}–${timeLabel(item.endAt)}`}
        detail={protectedBy ? `Nằm trong ${protectedBy.title}` : "Sự kiện"}
        align={tooltipAlign}
        above={tooltipAbove}
      />
    </button>
  );
}

function TimelineTooltip({
  id,
  title,
  time,
  detail,
  warning = false,
  align,
  above,
}: {
  id: string;
  title: string;
  time: string;
  detail: string;
  warning?: boolean;
  align: "start" | "center" | "end";
  above: boolean;
}) {
  return (
    <span
      id={id}
      role="tooltip"
      className={cn(
        "bg-surface text-foreground border-border pointer-events-none invisible absolute z-50 w-56 rounded-xl border p-3 text-left opacity-0 shadow-xl transition-[opacity,visibility,transform] duration-150 group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100",
        above
          ? "bottom-full mb-2 translate-y-1 group-hover:translate-y-0 group-focus:translate-y-0"
          : "top-full mt-2 -translate-y-1 group-hover:translate-y-0 group-focus:translate-y-0",
        align === "start"
          ? "left-0"
          : align === "end"
            ? "right-0"
            : "left-1/2 -translate-x-1/2",
      )}
    >
      <span className="block text-xs leading-4 font-semibold whitespace-normal">
        {title}
      </span>
      <span className="text-muted-foreground mt-1 block text-[10px] tabular-nums">
        {time}
      </span>
      <span
        className={cn(
          "mt-2 flex items-start gap-1.5 text-[10px] leading-4 whitespace-normal",
          warning ? "text-warning" : "text-muted-foreground",
        )}
      >
        {warning ? (
          <CircleAlert className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
        ) : null}
        {detail}
      </span>
    </span>
  );
}

function DayAgenda({
  day,
  items,
  routines,
  onEdit,
  onCreate,
}: DayContentProps) {
  const entries = buildDayEntries(routines, items);
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
        {entries.map((entry) =>
          entry.kind === "ROUTINE" ? (
            <RoutineBlock
              key={entry.key}
              title={entry.routine.title}
              start={entry.routine.startTime}
              end={entry.routine.endTime}
            />
          ) : (
            <CalendarBlock key={entry.key} item={entry.item} onEdit={onEdit} />
          ),
        )}
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
