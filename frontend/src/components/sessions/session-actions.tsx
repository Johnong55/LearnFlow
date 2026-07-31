"use client";

import { useMutation } from "@tanstack/react-query";
import { Check, Pause, Play, SkipForward } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { StudySession } from "@/lib/api/calendar.api";
import { isApiError } from "@/lib/api/errors";
import { sessionsApi } from "@/lib/api/sessions.api";

type SessionActionsProps = {
  session: StudySession;
  onChanged: () => void;
};

export function SessionActions({ session, onChanged }: SessionActionsProps) {
  const action = useMutation<
    unknown,
    unknown,
    "start" | "pause" | "complete" | "skip"
  >({
    mutationFn: (kind: "start" | "pause" | "complete" | "skip") => {
      if (kind === "start") return sessionsApi.start(session.id);
      if (kind === "pause") return sessionsApi.pause(session.id);
      if (kind === "complete")
        return sessionsApi.complete(session.id, {
          actualMinutes: session.plannedMinutes,
        });
      return sessionsApi.skip(session.id, {
        reason: "Người dùng chủ động dời phiên học.",
        reschedulingMode: "BALANCED",
      });
    },
    onSuccess: (_result, kind) => {
      toast.success(
        kind === "complete"
          ? "Đã hoàn thành phiên học"
          : kind === "skip"
            ? "Phiên học sẽ được xếp lại"
            : kind === "pause"
              ? "Đã tạm dừng"
              : "Đã bắt đầu phiên học",
      );
      onChanged();
    },
    onError: (error) =>
      toast.error(
        isApiError(error) ? error.message : "Không thể cập nhật phiên học.",
      ),
  });

  if (["COMPLETED", "SKIPPED", "MISSED", "CANCELLED"].includes(session.status))
    return null;

  return (
    <div className="flex flex-wrap gap-2">
      {session.status === "IN_PROGRESS" ? (
        <Button
          size="sm"
          variant="secondary"
          loading={action.isPending}
          onClick={() => action.mutate("pause")}
        >
          <Pause className="size-3.5" /> Tạm dừng
        </Button>
      ) : (
        <Button
          size="sm"
          loading={action.isPending}
          onClick={() => action.mutate("start")}
        >
          <Play className="size-3.5" />{" "}
          {session.status === "PAUSED" ? "Tiếp tục" : "Bắt đầu"}
        </Button>
      )}
      <Button
        size="sm"
        variant="secondary"
        disabled={action.isPending}
        onClick={() => action.mutate("complete")}
      >
        <Check className="size-3.5" /> Hoàn thành
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={action.isPending}
        onClick={() => action.mutate("skip")}
      >
        <SkipForward className="size-3.5" /> Dời lịch
      </Button>
    </div>
  );
}
