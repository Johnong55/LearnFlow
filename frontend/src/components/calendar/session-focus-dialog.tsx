"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "framer-motion";
import {
  Brain,
  Check,
  CirclePause,
  Coffee,
  Flag,
  Keyboard,
  NotebookPen,
  Play,
  SkipForward,
  Timer,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  breakTimerSnapshot,
  focusTimerSnapshot,
  formatFocusDuration,
  sessionElapsedSeconds,
} from "@/features/sessions/focus-timer";
import type { StudySessionItem } from "@/lib/api/calendar.api";
import { motionTokens } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

type SessionAction =
  | { action: "start" | "pause" | "skip" }
  | {
      action: "complete";
      actualMinutes: number;
      notes: string;
      difficultyRating: number;
      focusLevel: number;
      tookLongerThanExpected: boolean;
    };

const circumference = 2 * Math.PI * 114;

export function SessionFocusDialog({
  open,
  session,
  pending,
  onOpenChange,
  onAction,
}: {
  open: boolean;
  session: StudySessionItem;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: SessionAction) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [focusLevel, setFocusLevel] = useState(4);
  const [difficultyRating, setDifficultyRating] = useState(3);
  const elapsedSeconds = sessionElapsedSeconds(session, now, openedAt);
  const focusTimer = focusTimerSnapshot(elapsedSeconds, session.plannedMinutes);
  const [actualMinutes, setActualMinutes] = useState(
    session.actualMinutes ?? focusTimer.actualMinutes,
  );
  const [tookLonger, setTookLonger] = useState(false);
  const canStart =
    session.status === "SCHEDULED" || session.status === "PAUSED";
  const canPause = session.status === "IN_PROGRESS";
  const canComplete =
    session.status === "IN_PROGRESS" || session.status === "PAUSED";
  const parsedPausedAt = session.pausedAt
    ? new Date(session.pausedAt).getTime()
    : Number.NaN;
  const breakTimer = breakTimerSnapshot(
    Number.isFinite(parsedPausedAt) ? parsedPausedAt : openedAt,
    now,
    breakMinutes,
  );
  const scheduledTime = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }).formatRange(new Date(session.startAt), new Date(session.endAt)),
    [session.endAt, session.startAt],
  );

  useEffect(() => {
    if (session.status !== "IN_PROGRESS" && session.status !== "PAUSED") return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [session.status]);

  const beginReview = () => {
    setActualMinutes(focusTimer.actualMinutes);
    setTookLonger(focusTimer.overtimeSeconds > 0);
    setReviewing(true);
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!event.altKey || pending) return;
      if (event.key.toLowerCase() === "p" && (canPause || canStart)) {
        event.preventDefault();
        onAction({ action: canPause ? "pause" : "start" });
      }
      if (event.key === "Enter" && canComplete) {
        event.preventDefault();
        beginReview();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  });

  const focusTimerText = focusTimer.overtimeSeconds
    ? formatFocusDuration(focusTimer.overtimeSeconds)
    : formatFocusDuration(focusTimer.remainingSeconds);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-md" />
        <Dialog.Content className="fixed inset-0 z-50 overflow-y-auto bg-[var(--focus-background)] text-[var(--focus-text)] outline-none sm:inset-3 sm:rounded-[36px] lg:inset-5">
          <div className="pointer-events-none fixed inset-0 overflow-hidden sm:inset-3 lg:inset-5">
            <div className="absolute -top-56 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-[var(--focus-glow-primary)] blur-3xl" />
          </div>

          <div className="relative mx-auto flex min-h-full max-w-5xl flex-col p-4 sm:p-7">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-white/8 text-[var(--focus-primary)]">
                  <Brain className="size-4" />
                </span>
                <span className="text-sm font-semibold">Focus</span>
              </div>
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[var(--focus-muted)] hover:bg-white/8 hover:text-[var(--focus-text)]"
                  aria-label="Thoát focus mode"
                >
                  <X className="size-5" />
                </Button>
              </Dialog.Close>
            </header>

            <main className="grid flex-1 place-items-center py-8 sm:py-10">
              <motion.div
                key={
                  reviewing
                    ? "review"
                    : session.status === "PAUSED"
                      ? "break"
                      : "focus"
                }
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: motionTokens.duration.normal,
                  ease: motionTokens.easing.enter,
                }}
                className="w-full text-center"
              >
                {reviewing ? (
                  <ReviewPanel
                    notes={notes}
                    actualMinutes={actualMinutes}
                    focusLevel={focusLevel}
                    difficultyRating={difficultyRating}
                    tookLonger={tookLonger}
                    pending={pending}
                    onNotesChange={setNotes}
                    onActualMinutesChange={setActualMinutes}
                    onFocusLevelChange={setFocusLevel}
                    onDifficultyChange={setDifficultyRating}
                    onTookLongerChange={setTookLonger}
                    onCancel={() => setReviewing(false)}
                    onComplete={() =>
                      onAction({
                        action: "complete",
                        actualMinutes: Math.round(actualMinutes),
                        notes: notes.trim(),
                        difficultyRating,
                        focusLevel,
                        tookLongerThanExpected: tookLonger,
                      })
                    }
                  />
                ) : session.status === "PAUSED" ? (
                  <BreakView
                    timer={breakTimer}
                    breakMinutes={breakMinutes}
                    pending={pending}
                    reduceMotion={Boolean(reduceMotion)}
                    onBreakMinutesChange={setBreakMinutes}
                    onResume={() => onAction({ action: "start" })}
                  />
                ) : (
                  <>
                    <p className="text-xs font-semibold text-[var(--focus-primary)]">
                      {session.task.module?.milestone?.title ??
                        "Phiên học hôm nay"}
                    </p>
                    <Dialog.Title className="font-display mx-auto mt-3 max-w-3xl text-3xl leading-tight font-bold tracking-[-0.04em] sm:text-5xl">
                      {session.task.title}
                    </Dialog.Title>
                    <Dialog.Description className="sr-only">
                      {session.task.description ||
                        "Tập trung vào nhiệm vụ học tập hiện tại."}
                    </Dialog.Description>

                    <div className="mt-8">
                      <TimerRing
                        text={focusTimerText}
                        label={
                          focusTimer.overtimeSeconds
                            ? "vượt dự kiến"
                            : session.status === "SCHEDULED"
                              ? "sẵn sàng"
                              : "còn lại"
                        }
                        ariaLabel={
                          focusTimer.overtimeSeconds
                            ? `Đã vượt ${focusTimerText}`
                            : `Còn lại ${focusTimerText}`
                        }
                        progress={focusTimer.progress}
                        reduceMotion={Boolean(reduceMotion)}
                        accent={
                          focusTimer.overtimeSeconds ? "accent" : "primary"
                        }
                      />
                    </div>

                    <p className="mx-auto mt-6 max-w-lg text-sm leading-6 text-[var(--focus-muted)]">
                      {session.status === "SCHEDULED"
                        ? "Khi sẵn sàng, hãy bắt đầu. Chỉ một việc trong phiên này."
                        : "Giữ sự chú ý cho bước nhỏ đang ở trước mắt."}
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--focus-muted)]/70">
                      {scheduledTime} · {session.plannedMinutes} phút
                    </p>

                    <div className="mt-7 flex flex-wrap justify-center gap-3">
                      {canStart ? (
                        <Button
                          size="lg"
                          loading={pending}
                          onClick={() => onAction({ action: "start" })}
                        >
                          <Play className="size-4" /> Bắt đầu
                        </Button>
                      ) : null}
                      {canPause ? (
                        <Button
                          size="lg"
                          variant="secondary"
                          className="border-white/12 bg-white/7 text-[var(--focus-text)] hover:bg-white/10"
                          loading={pending}
                          onClick={() => onAction({ action: "pause" })}
                        >
                          <CirclePause className="size-4" /> Nghỉ một nhịp
                        </Button>
                      ) : null}
                      {canComplete ? (
                        <Button
                          size="lg"
                          variant="ghost"
                          className="text-[var(--focus-muted)] hover:bg-white/8 hover:text-[var(--focus-text)]"
                          disabled={pending}
                          onClick={beginReview}
                        >
                          <Flag className="size-4" /> Hoàn thành
                        </Button>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      aria-expanded={notesOpen}
                      onClick={() => setNotesOpen((value) => !value)}
                      className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--focus-muted)] hover:bg-white/6 hover:text-[var(--focus-text)]"
                    >
                      <NotebookPen className="size-3.5" />
                      {notesOpen ? "Ẩn ghi chú" : "Ghi chú nhanh"}
                    </button>
                    {notesOpen ? (
                      <div className="mx-auto mt-3 max-w-lg">
                        <textarea
                          value={notes}
                          maxLength={5000}
                          onChange={(event) => setNotes(event.target.value)}
                          placeholder="Ghi lại một ý quan trọng…"
                          aria-label="Ghi chú phiên học"
                          autoFocus
                          className="min-h-24 w-full resize-y rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-left text-sm leading-6 outline-none placeholder:text-[var(--focus-muted)]/60 focus:border-[var(--focus-primary)]"
                        />
                      </div>
                    ) : null}

                    {session.status === "SCHEDULED" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onAction({ action: "skip" })}
                        className="mx-auto mt-5 flex items-center gap-1.5 text-[10px] text-[var(--focus-muted)] hover:text-[var(--focus-text)] disabled:opacity-50"
                      >
                        <SkipForward className="size-3" /> Tìm giờ khác
                      </button>
                    ) : null}
                  </>
                )}
              </motion.div>
            </main>

            <footer className="hidden justify-center text-[10px] text-[var(--focus-muted)]/70 sm:flex">
              <span className="inline-flex items-center gap-2">
                <Keyboard className="size-3.5" /> Alt + P: nghỉ/tiếp tục · Alt +
                Enter: hoàn thành
              </span>
            </footer>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TimerRing({
  text,
  label,
  ariaLabel,
  progress,
  reduceMotion,
  accent,
}: {
  text: string;
  label: string;
  ariaLabel: string;
  progress: number;
  reduceMotion: boolean;
  accent: "primary" | "accent";
}) {
  return (
    <div className="relative mx-auto grid size-60 place-items-center sm:size-72">
      <svg
        className="absolute inset-0 size-full -rotate-90"
        viewBox="0 0 256 256"
        aria-hidden="true"
      >
        <circle
          cx="128"
          cy="128"
          r="114"
          fill="none"
          stroke="var(--focus-ring)"
          strokeWidth="7"
        />
        <motion.circle
          cx="128"
          cy="128"
          r="114"
          fill="none"
          stroke={
            accent === "accent" ? "var(--focus-accent)" : "var(--focus-primary)"
          }
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={
            reduceMotion ? { duration: 0 } : motionTokens.spring.gentle
          }
        />
      </svg>
      <div className="relative text-center">
        <Timer
          className={cn(
            "mx-auto mb-2 size-5",
            accent === "accent"
              ? "text-[var(--focus-accent)]"
              : "text-[var(--focus-primary)]",
          )}
        />
        <p
          className="font-display text-5xl font-bold tabular-nums sm:text-6xl"
          role="timer"
          aria-label={ariaLabel}
        >
          {text}
        </p>
        <p className="mt-2 text-xs font-semibold text-[var(--focus-muted)]">
          {label}
        </p>
      </div>
    </div>
  );
}

function BreakView({
  timer,
  breakMinutes,
  pending,
  reduceMotion,
  onBreakMinutesChange,
  onResume,
}: {
  timer: ReturnType<typeof breakTimerSnapshot>;
  breakMinutes: number;
  pending: boolean;
  reduceMotion: boolean;
  onBreakMinutesChange: (minutes: number) => void;
  onResume: () => void;
}) {
  const time = formatFocusDuration(timer.remainingSeconds);
  return (
    <div>
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--focus-primary-soft)] text-[var(--focus-primary)]">
        <Coffee className="size-5" />
      </span>
      <h2 className="font-display mt-4 text-3xl font-bold sm:text-5xl">
        {timer.completed ? "Đã nghỉ đủ rồi" : "Nghỉ một nhịp"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--focus-muted)]">
        {timer.completed
          ? "Bạn có thể quay lại khi cảm thấy sẵn sàng."
          : "Rời mắt khỏi màn hình, thả lỏng vai và hít thở chậm."}
      </p>
      <div className="mt-7">
        <TimerRing
          text={time}
          label={timer.completed ? "đã sẵn sàng" : "thời gian nghỉ còn lại"}
          ariaLabel={`Nghỉ còn ${time}`}
          progress={timer.progress}
          reduceMotion={reduceMotion}
          accent="accent"
        />
      </div>
      <div
        className="mt-6 flex justify-center gap-2"
        aria-label="Thời lượng nghỉ"
      >
        {[5, 10].map((minutes) => (
          <button
            key={minutes}
            type="button"
            aria-pressed={breakMinutes === minutes}
            onClick={() => onBreakMinutesChange(minutes)}
            className={cn(
              "rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-[var(--focus-muted)] hover:bg-white/8",
              breakMinutes === minutes &&
                "border-[var(--focus-accent)]/40 bg-white/8 text-[var(--focus-text)]",
            )}
          >
            {minutes} phút
          </button>
        ))}
      </div>
      <Button size="lg" className="mt-6" loading={pending} onClick={onResume}>
        <Play className="size-4" /> Quay lại học
      </Button>
    </div>
  );
}

function ReviewPanel({
  notes,
  actualMinutes,
  focusLevel,
  difficultyRating,
  tookLonger,
  pending,
  onNotesChange,
  onActualMinutesChange,
  onFocusLevelChange,
  onDifficultyChange,
  onTookLongerChange,
  onCancel,
  onComplete,
}: {
  notes: string;
  actualMinutes: number;
  focusLevel: number;
  difficultyRating: number;
  tookLonger: boolean;
  pending: boolean;
  onNotesChange: (value: string) => void;
  onActualMinutesChange: (value: number) => void;
  onFocusLevelChange: (value: number) => void;
  onDifficultyChange: (value: number) => void;
  onTookLongerChange: (value: boolean) => void;
  onCancel: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-[28px] border border-white/10 bg-[var(--focus-surface)] p-5 text-left sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[var(--focus-primary)]">
            Trước khi kết thúc
          </p>
          <h2 className="font-display mt-1 text-3xl font-bold">
            Phiên học thế nào?
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl p-2 text-[var(--focus-muted)] hover:bg-white/8"
          aria-label="Quay lại phiên học"
        >
          <X className="size-4" />
        </button>
      </div>
      <RatingField
        label="Mức tập trung"
        value={focusLevel}
        labels={["Rất thấp", "Thấp", "Ổn", "Tốt", "Rất tốt"]}
        onChange={onFocusLevelChange}
      />
      <RatingField
        label="Độ khó thực tế"
        value={difficultyRating}
        labels={["Rất dễ", "Dễ", "Vừa", "Khó", "Rất khó"]}
        onChange={onDifficultyChange}
      />
      <label className="mt-5 block text-xs font-semibold">
        Một điều muốn ghi nhớ
        <textarea
          value={notes}
          maxLength={5000}
          onChange={(event) => onNotesChange(event.target.value)}
          aria-label="Ghi chú phiên học"
          placeholder="Không bắt buộc"
          className="mt-2 min-h-20 w-full resize-y rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm leading-6 outline-none placeholder:text-[var(--focus-muted)]/60 focus:border-[var(--focus-primary)]"
        />
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold">
          Thời gian thực tế
          <span className="relative mt-2 block">
            <input
              type="number"
              min={1}
              max={1440}
              value={Math.round(actualMinutes)}
              onChange={(event) =>
                onActualMinutesChange(Number(event.target.value))
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-black/10 px-3 pr-12 text-sm outline-none focus:border-[var(--focus-primary)]"
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-[var(--focus-muted)]">
              phút
            </span>
          </span>
        </label>
        <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-xs font-semibold sm:mt-5">
          <input
            type="checkbox"
            checked={tookLonger}
            onChange={(event) => onTookLongerChange(event.target.checked)}
            className="size-4 accent-[var(--focus-primary)]"
          />
          Lâu hơn dự kiến
        </label>
      </div>
      <Button
        size="lg"
        success
        className="mt-5 w-full"
        loading={pending}
        loadingLabel="Đang lưu…"
        disabled={!Number.isFinite(actualMinutes) || actualMinutes < 1}
        onClick={onComplete}
      >
        <Check className="size-4" /> Hoàn thành và lưu
      </Button>
    </div>
  );
}

function RatingField({
  label,
  value,
  labels,
  onChange,
}: {
  label: string;
  value: number;
  labels: string[];
  onChange: (value: number) => void;
}) {
  return (
    <fieldset className="mt-5">
      <legend className="text-xs font-semibold">{label}</legend>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {labels.map((item, index) => {
          const rating = index + 1;
          return (
            <button
              key={item}
              type="button"
              aria-label={`${label}: ${item}`}
              aria-pressed={value === rating}
              onClick={() => onChange(rating)}
              className={cn(
                "min-h-10 rounded-xl border border-white/10 text-xs font-bold outline-none hover:bg-white/8 focus-visible:ring-3 focus-visible:ring-[var(--focus-primary)]/40",
                value === rating &&
                  "border-[var(--focus-primary)] bg-[var(--focus-primary)] text-[var(--focus-background)]",
              )}
            >
              {rating}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-right text-[10px] text-[var(--focus-muted)]">
        {labels[value - 1]}
      </p>
    </fieldset>
  );
}
