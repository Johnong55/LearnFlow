"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, CirclePause, Play, SkipForward, Timer, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { StudySessionItem } from "@/lib/api/calendar.api";

type SessionAction =
  | { action: "start" | "pause" | "skip" }
  | { action: "complete"; actualMinutes: number; notes: string };

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
  const [actualMinutes, setActualMinutes] = useState(
    session.actualMinutes ?? session.plannedMinutes,
  );
  const [notes, setNotes] = useState("");
  const canStart =
    session.status === "SCHEDULED" || session.status === "PAUSED";
  const canPause = session.status === "IN_PROGRESS";
  const canComplete =
    session.status === "IN_PROGRESS" || session.status === "PAUSED";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-md" />
        <Dialog.Content className="bg-primary-deep text-background fixed inset-0 z-50 overflow-y-auto p-5 outline-none sm:inset-6 sm:rounded-[32px] sm:p-10">
          <div className="mx-auto flex min-h-full max-w-4xl flex-col">
            <div className="flex justify-between">
              <span className="text-primary inline-flex items-center gap-2 text-sm font-semibold">
                <Timer className="size-4" /> Focus mode
              </span>
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-background hover:bg-white/10"
                  aria-label="Thoát focus mode"
                >
                  <X className="size-5" />
                </Button>
              </Dialog.Close>
            </div>
            <div className="my-auto py-10 text-center">
              <p className="text-primary text-xs font-bold tracking-[0.14em] uppercase">
                {session.task.module?.milestone?.title ?? "Phiên học hôm nay"}
              </p>
              <Dialog.Title className="font-display mx-auto mt-4 max-w-3xl text-4xl leading-tight font-bold sm:text-6xl">
                {session.task.title}
              </Dialog.Title>
              <Dialog.Description className="mx-auto mt-5 max-w-2xl text-sm leading-7 opacity-70">
                {session.task.description}
              </Dialog.Description>
              <div className="mt-8 flex items-center justify-center gap-2 text-lg">
                <Timer className="text-primary size-5" />
                <strong>{session.plannedMinutes} phút đã lên kế hoạch</strong>
              </div>
              <div className="mx-auto mt-10 grid max-w-xl gap-4 text-left sm:grid-cols-2">
                <Input
                  type="number"
                  min={1}
                  max={1440}
                  label="Thời gian thực tế (phút)"
                  value={actualMinutes}
                  onChange={(event) =>
                    setActualMinutes(Number(event.target.value))
                  }
                  className="bg-white/10 text-white"
                />
                <Textarea
                  label="Ghi chú phiên học"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="bg-white/10 text-white"
                />
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {canStart ? (
                  <Button
                    size="lg"
                    loading={pending}
                    onClick={() => onAction({ action: "start" })}
                  >
                    <Play className="size-4" />{" "}
                    {session.status === "PAUSED" ? "Tiếp tục" : "Bắt đầu"}
                  </Button>
                ) : null}
                {canPause ? (
                  <Button
                    size="lg"
                    variant="secondary"
                    loading={pending}
                    onClick={() => onAction({ action: "pause" })}
                  >
                    <CirclePause className="size-4" /> Tạm dừng
                  </Button>
                ) : null}
                {canComplete ? (
                  <Button
                    size="lg"
                    success
                    loading={pending}
                    onClick={() =>
                      onAction({ action: "complete", actualMinutes, notes })
                    }
                  >
                    <Check className="size-4" /> Hoàn thành
                  </Button>
                ) : null}
                {session.status === "SCHEDULED" ? (
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-background hover:bg-white/10"
                    loading={pending}
                    onClick={() => onAction({ action: "skip" })}
                  >
                    <SkipForward className="size-4" /> Bỏ qua & xếp lại
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
