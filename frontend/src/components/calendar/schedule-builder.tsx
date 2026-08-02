"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  Clock3,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { InlineAlert } from "@/components/feedback/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { isApiError } from "@/lib/api/errors";
import { roadmapsApi } from "@/lib/api/roadmaps.api";
import {
  schedulesApi,
  type ScheduleJob,
  type SchedulePlan,
  type ScheduleRequest,
} from "@/lib/api/schedules.api";
import { queryKeys } from "@/lib/query/keys";

type ScheduleBuilderProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: () => void;
  roadmapId?: string;
};

export function ScheduleBuilder({
  open,
  onOpenChange,
  onGenerated,
  roadmapId,
}: ScheduleBuilderProps) {
  const queryClient = useQueryClient();
  const [minimumSessionMinutes, setMinimumSessionMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [mode, setMode] = useState<
    "BALANCED" | "DEADLINE_FOCUSED" | "LOW_STRESS"
  >("BALANCED");
  const [preview, setPreview] = useState<SchedulePlan | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const completionHandled = useRef<string | null>(null);
  const roadmaps = useQuery({
    queryKey: queryKeys.roadmaps.all,
    queryFn: ({ signal }) => roadmapsApi.list(signal),
  });
  const roadmap = roadmapId
    ? roadmaps.data?.find((item) => item.id === roadmapId)
    : (roadmaps.data?.find((item) => item.activeVersionNumber) ??
      roadmaps.data?.find((item) => item.currentVersionNumber));
  const jobStorageKey = roadmap
    ? `skillpilot:schedule-job:${roadmap.id}`
    : null;
  const request = (): ScheduleRequest => ({
    roadmapId: roadmap!.id,
    mode,
    minimumSessionMinutes,
    breakMinutes,
  });
  const previewMutation = useMutation({
    mutationFn: () => schedulesApi.preview(request()),
    onSuccess: setPreview,
  });
  const generateMutation = useMutation({
    mutationFn: () =>
      (preview?.impact?.existingSessions ?? 0) > 0
        ? schedulesApi.rebalance(request())
        : schedulesApi.generate(request()),
    onSuccess: (job) => {
      setJobId(job.jobId);
      if (jobStorageKey) sessionStorage.setItem(jobStorageKey, job.jobId);
    },
  });
  const jobQuery = useQuery({
    queryKey: queryKeys.schedules.job(jobId ?? "none"),
    queryFn: ({ signal }) => schedulesApi.job(jobId!, signal),
    enabled: Boolean(jobId),
    refetchInterval: (query) =>
      ["QUEUED", "RUNNING"].includes(
        (query.state.data as ScheduleJob | undefined)?.status ?? "",
      )
        ? 1200
        : false,
  });
  const completed = jobQuery.data?.status === "COMPLETED";
  const failed = jobQuery.data?.status === "FAILED";
  const jobActive = Boolean(
    generateMutation.isPending ||
    (jobId && !completed && !failed && !jobQuery.isError),
  );

  const clearJob = () => {
    if (jobStorageKey) sessionStorage.removeItem(jobStorageKey);
    setJobId(null);
    generateMutation.reset();
  };

  const changePlanningOptions = (change: () => void) => {
    change();
    setPreview(null);
    previewMutation.reset();
    generateMutation.reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && jobActive) {
      toast.info("Lịch vẫn tiếp tục được tạo trong nền.");
    }
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!jobStorageKey || jobId) return;
    const storedJobId = sessionStorage.getItem(jobStorageKey);
    if (!storedJobId) return;
    const frame = window.requestAnimationFrame(() => setJobId(storedJobId));
    return () => window.cancelAnimationFrame(frame);
  }, [jobId, jobStorageKey]);

  useEffect(() => {
    if (completed && jobId && completionHandled.current !== jobId) {
      completionHandled.current = jobId;
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    }
  }, [completed, jobId, queryClient]);

  const finish = () => {
    if (jobStorageKey) sessionStorage.removeItem(jobStorageKey);
    toast.success("Lịch học đã được tạo");
    onGenerated();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-sm" />
        <Dialog.Content className="border-border bg-background fixed inset-x-0 bottom-0 z-50 max-h-[94vh] overflow-y-auto rounded-t-[30px] border p-5 shadow-2xl outline-none sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[min(94vw,52rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <Dialog.Title className="font-display text-2xl font-bold">
                Tạo lịch học thực tế
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground mt-1 text-sm">
                Xem trước bằng thuật toán deterministic trước khi lưu.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="size-5" />
                <span className="sr-only">Đóng</span>
              </Button>
            </Dialog.Close>
          </div>
          {!roadmap && !roadmaps.isPending ? (
            <InlineAlert tone="info">
              Bạn cần có roadmap đã tạo trước khi xếp lịch.
            </InlineAlert>
          ) : null}
          {previewMutation.error || generateMutation.error || jobQuery.error ? (
            <InlineAlert tone="error">
              {isApiError(
                previewMutation.error ??
                  generateMutation.error ??
                  jobQuery.error,
              )
                ? (
                    previewMutation.error ??
                    generateMutation.error ??
                    (jobQuery.error as { message: string })
                  ).message
                : "Không thể tạo lịch."}
            </InlineAlert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              type="number"
              min={15}
              max={120}
              label="Phiên tối thiểu"
              disabled={jobActive}
              value={minimumSessionMinutes}
              onChange={(event) =>
                changePlanningOptions(() =>
                  setMinimumSessionMinutes(Number(event.target.value)),
                )
              }
            />
            <Input
              type="number"
              min={0}
              max={60}
              label="Nghỉ giữa phiên"
              disabled={jobActive}
              value={breakMinutes}
              onChange={(event) =>
                changePlanningOptions(() =>
                  setBreakMinutes(Number(event.target.value)),
                )
              }
            />
            <SelectField
              label="Chế độ"
              disabled={jobActive}
              value={mode}
              onChange={(event) =>
                changePlanningOptions(() =>
                  setMode(event.target.value as typeof mode),
                )
              }
              options={[
                { value: "BALANCED", label: "Cân bằng" },
                { value: "DEADLINE_FOCUSED", label: "Tập trung deadline" },
                { value: "LOW_STRESS", label: "Ít áp lực" },
              ]}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={!roadmap || jobActive}
              loading={previewMutation.isPending}
              loadingLabel="Đang tính slot…"
              onClick={() => previewMutation.mutate()}
            >
              <WandSparkles className="size-4" /> Xem trước
            </Button>
            {preview ? (
              <Button
                disabled={jobActive}
                loading={generateMutation.isPending}
                loadingLabel="Đang đưa vào hàng đợi…"
                onClick={() => generateMutation.mutate()}
              >
                <CalendarCheck className="size-4" />
                {(preview.impact?.existingSessions ?? 0) > 0
                  ? "Tái cân bằng lịch"
                  : "Lưu lịch này"}
              </Button>
            ) : null}
          </div>
          {preview ? (
            <div className="mt-6">
              {(preview.impact?.existingSessions ?? 0) > 0 ? (
                <div className="border-warning/35 bg-accent-soft mb-4 rounded-xl border p-3 text-sm leading-6">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-warning mt-1 size-4 shrink-0" />
                    <div>
                      <strong className="block">Lịch học đã tồn tại</strong>
                      <span className="text-muted-foreground">
                        {preview.impact!.existingSessions} phiên chưa bắt đầu sẽ
                        được thay thế bằng phương án xem trước này. Phiên đã
                        hoàn thành và phiên tạo thủ công vẫn được giữ nguyên.
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-success/25 bg-success-soft text-success-foreground mb-4 rounded-xl border p-3 text-sm">
                  Đây là lịch mới và không thay thế phiên học nào hiện có.
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="bg-primary-soft rounded-2xl p-4">
                  <strong className="font-display text-2xl">
                    {preview.summary.scheduledSessions}
                  </strong>
                  <span className="text-muted-foreground block text-xs">
                    phiên học
                  </span>
                </div>
                <div className="bg-info-soft rounded-2xl p-4">
                  <strong className="font-display text-2xl">
                    {preview.summary.scheduledMinutes}
                  </strong>
                  <span className="text-muted-foreground block text-xs">
                    phút học
                  </span>
                </div>
                <div className="bg-success-soft rounded-2xl p-4">
                  <strong className="font-display text-2xl">
                    {preview.summary.scheduledTasks}
                  </strong>
                  <span className="text-muted-foreground block text-xs">
                    task đã xếp
                  </span>
                </div>
                <div className="bg-accent-soft rounded-2xl p-4">
                  <strong className="font-display text-2xl">
                    {preview.summary.unscheduledTasks}
                  </strong>
                  <span className="text-muted-foreground block text-xs">
                    chưa xếp được
                  </span>
                </div>
              </div>
              <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
                {preview.sessions.slice(0, 10).map((session) => (
                  <div
                    key={`${session.taskId}-${session.startAt}`}
                    className="border-border flex items-center gap-3 rounded-xl border p-3"
                  >
                    <Clock3 className="text-primary-strong size-4" />
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-sm">
                        {session.taskTitle}
                      </strong>
                      <span className="text-muted-foreground text-xs">
                        {new Intl.DateTimeFormat("vi-VN", {
                          weekday: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(session.startAt))}{" "}
                        · {session.plannedMinutes} phút
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {preview.unscheduledTasks.length ? (
                <div className="border-warning/25 bg-accent-soft mt-4 rounded-xl border p-3 text-sm">
                  <AlertTriangle className="text-warning mr-2 inline size-4" />
                  {preview.unscheduledTasks.length} task chưa có slot phù hợp.
                </div>
              ) : null}
            </div>
          ) : null}
          {jobId ? (
            <div className="bg-surface-muted mt-6 rounded-2xl p-4">
              <div className="flex items-center justify-between text-sm">
                <span>{jobQuery.data?.message ?? "Đang tạo lịch…"}</span>
                <strong>{jobQuery.data?.progress ?? 0}%</strong>
              </div>
              <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-[width]"
                  style={{ width: `${jobQuery.data?.progress ?? 0}%` }}
                />
              </div>
              {completed ? (
                <Button success className="mt-4" onClick={finish}>
                  <Check className="size-4" /> Xem lịch đã tạo
                </Button>
              ) : null}
              {failed ? (
                <div className="mt-3">
                  <p className="text-danger text-sm">
                    {jobQuery.data?.error?.message ?? "Tạo lịch thất bại."}
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-3"
                    onClick={clearJob}
                  >
                    Thử lại
                  </Button>
                </div>
              ) : null}
              {jobQuery.isError ? (
                <Button variant="secondary" className="mt-3" onClick={clearJob}>
                  Bỏ trạng thái cũ và thử lại
                </Button>
              ) : null}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
