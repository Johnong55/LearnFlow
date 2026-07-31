"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Check,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { InlineAlert } from "@/components/feedback/inline-alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  generationStages,
  stageIndexForProgress,
} from "@/features/roadmaps/generation-stages";
import { isApiError } from "@/lib/api/errors";
import { roadmapJobsApi, type RoadmapJob } from "@/lib/api/roadmap-jobs.api";
import { schedulesApi, type ScheduleJob } from "@/lib/api/schedules.api";
import { motionTokens } from "@/lib/motion/tokens";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils/cn";

const isActive = (job?: RoadmapJob) =>
  job?.status === "QUEUED" || job?.status === "RUNNING";

const isScheduleActive = (job?: ScheduleJob) =>
  job?.status === "QUEUED" || job?.status === "RUNNING";

export function RoadmapGenerationExperience() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const started = useRef(false);
  const goalId = params.get("goalId");
  const jobId = params.get("jobId");

  const startMutation = useMutation({
    mutationFn: () => {
      if (!goalId) throw new Error("Không tìm thấy mục tiêu để tạo roadmap.");
      return roadmapJobsApi.start(goalId);
    },
    onSuccess: (job) => {
      queryClient.setQueryData(queryKeys.roadmaps.job(job.jobId), job);
      const next = new URLSearchParams(params.toString());
      next.set("jobId", job.jobId);
      router.replace(`${pathname}?${next.toString()}`, {
        scroll: false,
      });
    },
  });

  useEffect(() => {
    if (goalId && !jobId && !started.current) {
      started.current = true;
      startMutation.mutate();
    }
  }, [goalId, jobId, startMutation]);

  const jobQuery = useQuery({
    queryKey: queryKeys.roadmaps.job(jobId ?? "pending"),
    queryFn: ({ signal }) => roadmapJobsApi.get(jobId!, signal),
    enabled: Boolean(jobId),
    refetchInterval: (query) => (isActive(query.state.data) ? 1_500 : false),
    refetchIntervalInBackground: true,
    retry: 2,
  });

  const retryMutation = useMutation({
    mutationFn: () => roadmapJobsApi.retry(jobId!),
    onSuccess: (job) => {
      queryClient.setQueryData(queryKeys.roadmaps.job(job.jobId), job);
      toast.success("Đang thử tạo lại roadmap");
    },
  });

  const job = jobQuery.data;
  const roadmapCompleted =
    job?.status === "COMPLETED" && Boolean(job.result?.roadmapId);
  const scheduleJobId = job?.result?.scheduleJobId;
  const scheduleQuery = useQuery({
    queryKey: queryKeys.schedules.job(scheduleJobId ?? "pending"),
    queryFn: ({ signal }) => schedulesApi.job(scheduleJobId!, signal),
    enabled: roadmapCompleted && Boolean(scheduleJobId),
    refetchInterval: (query) =>
      isScheduleActive(query.state.data) ? 1_500 : false,
    refetchIntervalInBackground: true,
    retry: 2,
  });
  const schedule = scheduleQuery.data;
  const planningSchedule = roadmapCompleted && isScheduleActive(schedule);
  const scheduleFailed =
    roadmapCompleted &&
    (schedule?.status === "FAILED" || scheduleQuery.isError);
  const roadmapProgress = Math.max(0, Math.min(100, job?.progress ?? 0));
  const progress = planningSchedule
    ? Math.min(99, 90 + Math.round((schedule?.progress ?? 0) / 10))
    : roadmapProgress;
  const activeStage = stageIndexForProgress(progress);
  const failed = job?.status === "FAILED";
  const completed =
    roadmapCompleted &&
    (!scheduleJobId || schedule?.status === "COMPLETED" || scheduleFailed);
  const startError = startMutation.error;

  useEffect(() => {
    if (schedule?.status !== "COMPLETED") return;
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.all }),
      queryClient.invalidateQueries({ queryKey: ["calendar"] }),
    ]);
  }, [queryClient, schedule?.status]);

  if (!goalId) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <AlertCircle className="text-danger mx-auto size-10" />
        <h1 className="font-display mt-4 text-3xl font-bold">
          Thiếu mục tiêu học tập
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Hãy quay lại bước mục tiêu để SkillPilot biết roadmap cần được tạo cho
          điều gì.
        </p>
        <Button asChild className="mt-6">
          <Link href="/onboarding/goal">Quay lại mục tiêu</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-center">
        <motion.div
          className="bg-primary-deep text-primary mx-auto grid size-20 place-items-center rounded-[28px] shadow-[0_22px_55px_-24px_var(--primary)]"
          animate={reduceMotion || completed ? false : { scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {completed ? (
            <Check className="size-9" strokeWidth={3} />
          ) : (
            <Sparkles className="size-9" />
          )}
        </motion.div>
        <h1 className="font-display mt-6 text-4xl leading-tight font-bold tracking-[-0.04em] sm:text-5xl">
          {planningSchedule
            ? "Đang xếp roadmap vào lịch của bạn."
            : completed
              ? "Roadmap của bạn đã sẵn sàng."
              : failed
                ? "Roadmap chưa thể hoàn thành."
                : "Đang biến mục tiêu thành một con đường rõ ràng."}
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-2xl leading-7">
          {planningSchedule
            ? "Các bài học đã được tạo. Scheduler đang bảo vệ giờ ngủ, công việc và routine trước khi chọn từng khung giờ học."
            : completed
              ? scheduleFailed
                ? "Roadmap đã sẵn sàng, nhưng lịch tự động chưa thể hoàn tất. Bạn vẫn có thể mở roadmap và lập lịch lại."
                : "Các milestone, module, task, nguồn tham khảo và lịch học đã được kiểm tra và lưu lại."
              : failed
                ? "Dữ liệu onboarding vẫn an toàn. Bạn có thể thử lại chính job này mà không tạo roadmap trùng."
                : (job?.message ?? "Đang đưa yêu cầu vào hàng đợi xử lý…")}
        </p>
      </div>

      {startError || jobQuery.isError || retryMutation.error ? (
        <InlineAlert tone="error">
          <span className="flex items-start gap-2">
            <WifiOff className="mt-0.5 size-4 shrink-0" />
            <span>
              {isApiError(startError ?? jobQuery.error ?? retryMutation.error)
                ? (
                    startError ??
                    jobQuery.error ??
                    (retryMutation.error as { message: string })
                  ).message
                : "Không thể kết nối tới tiến trình tạo roadmap."}
            </span>
          </span>
        </InlineAlert>
      ) : null}

      <Card className="mt-8 overflow-hidden p-5 sm:p-8">
        <div className="mb-7" aria-live="polite" aria-atomic="true">
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold">
              {planningSchedule
                ? (schedule?.message ?? "Đang lập lịch học theo từng ngày…")
                : completed
                  ? "Hoàn tất"
                  : failed
                    ? "Đã dừng"
                    : (job?.message ?? "Đang khởi tạo…")}
            </span>
            <span className="font-display text-primary-strong text-xl font-bold">
              {progress}%
            </span>
          </div>
          <div
            className="bg-muted h-3 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <motion.div
              className={cn(
                "h-full rounded-full",
                failed ? "bg-danger" : "bg-primary",
              )}
              animate={{ width: `${progress}%` }}
              transition={
                reduceMotion ? { duration: 0 } : motionTokens.spring.gentle
              }
            />
          </div>
        </div>

        <ol className="grid gap-3 md:grid-cols-2">
          {generationStages.map(
            ({ threshold, label, description, icon: Icon }, index) => {
              const done = progress > threshold || completed;
              const current = !failed && !completed && index === activeStage;
              return (
                <motion.li
                  key={label}
                  layout
                  className={cn(
                    "border-border relative flex gap-4 rounded-[20px] border p-4 transition-colors",
                    done && "border-success/25 bg-success-soft/55",
                    current && "border-primary/40 bg-primary-soft",
                  )}
                >
                  <span
                    className={cn(
                      "bg-surface-muted text-muted-foreground grid size-11 shrink-0 place-items-center rounded-2xl",
                      done && "bg-success text-white",
                      current && "bg-primary text-primary-foreground",
                    )}
                  >
                    {done ? (
                      <Check className="size-5" />
                    ) : current ? (
                      <LoaderCircle className="size-5 animate-spin" />
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold">{label}</h2>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      {description}
                    </p>
                  </div>
                </motion.li>
              );
            },
          )}
        </ol>

        {failed ? (
          <div className="border-danger/20 bg-coral-soft mt-6 rounded-2xl border p-5">
            <p className="text-danger font-semibold">
              {job.error?.message ?? "Quá trình tạo roadmap gặp lỗi."}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Mã lỗi: {job.error?.code ?? "ROADMAP_GENERATION_FAILED"}
            </p>
            <Button
              className="mt-4"
              loading={retryMutation.isPending}
              loadingLabel="Đang thử lại…"
              onClick={() => retryMutation.mutate()}
            >
              <RotateCcw className="size-4" /> Thử lại
            </Button>
          </div>
        ) : null}

        {scheduleFailed ? (
          <div className="border-warning/25 bg-warning-soft mt-6 rounded-2xl border p-5">
            <p className="text-warning-foreground font-semibold">
              Roadmap đã tạo xong nhưng chưa thể tự động xếp hết lịch học.
            </p>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              {schedule?.error?.message ??
                job?.result?.scheduleWarning ??
                "Hãy mở roadmap để xem conflict và yêu cầu hệ thống tìm khung giờ khác."}
            </p>
          </div>
        ) : null}

        {startError && !jobId ? (
          <div className="mt-6 text-center">
            <Button
              onClick={() => {
                started.current = true;
                startMutation.mutate();
              }}
              loading={startMutation.isPending}
            >
              <RefreshCw className="size-4" /> Kết nối lại
            </Button>
          </div>
        ) : null}
        {jobQuery.isError && jobId ? (
          <div className="mt-6 text-center">
            <Button variant="secondary" onClick={() => void jobQuery.refetch()}>
              <RefreshCw className="size-4" /> Kiểm tra lại trạng thái
            </Button>
          </div>
        ) : null}
        {completed && job?.result ? (
          <div className="mt-7 flex justify-center">
            <Button asChild size="lg" success>
              <Link href={`/app/roadmap?roadmapId=${job.result.roadmapId}`}>
                Khám phá kế hoạch của tôi <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        ) : null}
      </Card>
      <p className="text-muted-foreground mt-5 text-center text-xs leading-5">
        Bạn có thể tải lại hoặc đóng trang này. Job ID nằm trong URL để tiếp tục
        theo dõi an toàn.
      </p>
    </div>
  );
}
