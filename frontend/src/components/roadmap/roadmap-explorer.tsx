"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  ExternalLink,
  GitBranch,
  Layers3,
  List,
  Plus,
  RefreshCw,
  Route,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ScheduleBuilder } from "@/components/calendar/schedule-builder";
import { RoadmapDailyPlan } from "@/components/roadmap/roadmap-daily-plan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiError } from "@/lib/api/errors";
import { roadmapsApi } from "@/lib/api/roadmaps.api";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils/cn";

export function RoadmapExplorer() {
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"path" | "list" | "daily">("path");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const list = useQuery({
    queryKey: queryKeys.roadmaps.all,
    queryFn: ({ signal }) => roadmapsApi.list(signal),
  });
  const selectedId = params.get("roadmapId") ?? list.data?.[0]?.id ?? null;
  const detail = useQuery({
    queryKey: queryKeys.roadmaps.detail(selectedId ?? "none"),
    queryFn: ({ signal }) => roadmapsApi.detail(selectedId!, signal),
    enabled: Boolean(selectedId),
  });
  const activate = useMutation({
    mutationFn: () => roadmapsApi.activate(selectedId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.all });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.roadmaps.detail(selectedId!),
      });
      toast.success("Roadmap đã được kích hoạt");
    },
  });
  const regenerate = useMutation({
    mutationFn: () => roadmapsApi.regenerate(selectedId!),
    onSuccess: (job) => {
      router.push(
        `/app/roadmap/generating?goalId=${roadmap!.goalId}&jobId=${job.jobId}`,
      );
    },
    onError: (error) => {
      toast.error(
        isApiError(error)
          ? error.message
          : "Không thể bắt đầu tạo phiên bản roadmap mới.",
      );
    },
  });
  const roadmap = detail.data;
  const version = roadmap?.versions[0];
  const tasks =
    version?.milestones.flatMap((milestone) =>
      milestone.modules.flatMap((module) => module.tasks),
    ) ?? [];
  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;
  const rate = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  if (list.isPending) return <Skeleton className="h-[38rem]" />;
  if (list.isError)
    return (
      <Card className="text-center">
        <p className="text-danger font-semibold">
          Không thể tải danh sách roadmap.
        </p>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => void list.refetch()}
        >
          Thử lại
        </Button>
      </Card>
    );
  if (!list.data?.length)
    return (
      <Card className="grid min-h-96 place-items-center text-center">
        <div>
          <Route className="text-primary mx-auto size-12" />
          <h1 className="font-display mt-4 text-3xl font-bold">
            Chưa có roadmap
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Tạo một goal mới để AI phân tích và xây lộ trình phù hợp.
          </p>
          <Button asChild className="mt-6">
            <Link href="/app/roadmap/new">
              <Plus className="size-4" /> Thêm roadmap
            </Link>
          </Button>
        </div>
      </Card>
    );
  if (detail.isPending || !roadmap) return <Skeleton className="h-[38rem]" />;
  if (detail.isError || !version)
    return (
      <Card className="text-center">
        <p className="text-danger font-semibold">
          Roadmap chưa có phiên bản hợp lệ.
        </p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => void detail.refetch()}
        >
          Tải lại
        </Button>
      </Card>
    );

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="bg-primary-soft text-primary-strong rounded-full px-3 py-1 text-xs font-bold">
              {roadmap.status}
            </span>
            <span className="text-muted-foreground text-xs">
              Phiên bản {version.version}
            </span>
          </div>
          <h1 className="font-display max-w-4xl text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            {roadmap.title}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-3xl leading-7">
            {version.summary}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/app/roadmap/new">
              <Plus className="size-4" /> Thêm roadmap
            </Link>
          </Button>
          <Button
            variant="secondary"
            loading={regenerate.isPending}
            loadingLabel="Đang khởi tạo…"
            onClick={() => regenerate.mutate()}
          >
            <RefreshCw className="size-4" /> Tạo bản chi tiết hơn
          </Button>
          <Button variant="secondary" onClick={() => setScheduleOpen(true)}>
            <CalendarDays className="size-4" /> Lập lịch theo ngày
          </Button>
          {!roadmap.activeVersionNumber ? (
            <Button
              loading={activate.isPending}
              loadingLabel="Đang kích hoạt…"
              onClick={() => activate.mutate()}
            >
              <Sparkles className="size-4" /> Kích hoạt roadmap
            </Button>
          ) : null}
          <div className="bg-surface-muted flex rounded-xl p-1">
            <Button
              size="sm"
              variant={view === "path" ? "primary" : "ghost"}
              onClick={() => setView("path")}
            >
              <GitBranch className="size-4" /> Path
            </Button>
            <Button
              size="sm"
              variant={view === "list" ? "primary" : "ghost"}
              onClick={() => setView("list")}
            >
              <List className="size-4" /> List
            </Button>
            <Button
              size="sm"
              variant={view === "daily" ? "primary" : "ghost"}
              onClick={() => setView("daily")}
            >
              <CalendarDays className="size-4" /> Theo ngày
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <Clock3 className="text-info size-5" />
          <strong className="font-display mt-3 block text-3xl">
            {version.estimatedWeeks}
          </strong>
          <span className="text-muted-foreground text-sm">tuần ước tính</span>
        </Card>
        <Card className="p-5">
          <Layers3 className="text-warning size-5" />
          <strong className="font-display mt-3 block text-3xl">
            {version.milestones.length}
          </strong>
          <span className="text-muted-foreground text-sm">milestone</span>
        </Card>
        <Card className="p-5">
          <Check className="text-success size-5" />
          <strong className="font-display mt-3 block text-3xl">{rate}%</strong>
          <span className="text-muted-foreground text-sm">task hoàn thành</span>
        </Card>
      </div>

      {view === "daily" ? (
        <div className="mt-8">
          <RoadmapDailyPlan
            roadmapId={roadmap.id}
            estimatedWeeks={version.estimatedWeeks}
            onBuildSchedule={() => setScheduleOpen(true)}
          />
        </div>
      ) : (
        <div
          className={cn(
            "mt-8",
            view === "path" && "mx-auto max-w-4xl space-y-5",
          )}
        >
          {version.milestones.map((milestone, milestoneIndex) => (
            <div
              key={milestone.id}
              className={cn(
                "relative",
                view === "path" &&
                  milestoneIndex < version.milestones.length - 1 &&
                  "after:bg-primary/25 after:absolute after:top-full after:left-8 after:h-5 after:w-0.5",
              )}
            >
              <details
                className="border-border bg-surface group overflow-hidden rounded-[26px] border shadow-[0_20px_60px_-48px_rgb(24_57_43/0.5)]"
                open={milestoneIndex === 0}
              >
                <summary className="focus-visible:ring-ring/35 flex cursor-pointer list-none items-center gap-4 p-5 outline-none focus-visible:ring-3 sm:p-6">
                  <span className="bg-primary-deep text-primary font-display grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-bold">
                    {milestone.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl font-bold sm:text-2xl">
                      {milestone.title}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {milestone.estimatedHours} giờ ·{" "}
                      {milestone.modules.length} module
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground size-5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-border border-t px-5 py-5 sm:px-6">
                  <p className="text-muted-foreground mb-5 text-sm leading-6">
                    {milestone.description}
                  </p>
                  <div className="space-y-3">
                    {milestone.modules.map((module) => (
                      <details
                        key={module.id}
                        className="border-border bg-surface-muted/55 rounded-2xl border"
                      >
                        <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                          <BookOpen className="text-primary-strong size-5" />
                          <div className="flex-1">
                            <h3 className="font-semibold">{module.title}</h3>
                            <span className="text-muted-foreground text-xs">
                              {module.estimatedHours} giờ ·{" "}
                              {module.tasks.length} task
                            </span>
                          </div>
                          <ChevronRight className="size-4 transition-transform [[open]>&]:rotate-90" />
                        </summary>
                        <div className="space-y-2 px-4 pb-4">
                          {module.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="bg-surface flex items-start gap-3 rounded-xl p-3"
                            >
                              <Circle
                                className={cn(
                                  "mt-0.5 size-4 shrink-0",
                                  task.status === "COMPLETED"
                                    ? "fill-success text-success"
                                    : "text-muted-foreground",
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold">
                                  {task.title}
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs leading-5">
                                  {task.description}
                                </p>
                              </div>
                              <span className="text-muted-foreground shrink-0 text-xs">
                                {task.estimatedMinutes}p
                              </span>
                            </div>
                          ))}
                          {module.sourceReferences.length ? (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {module.sourceReferences.map(({ source }) => (
                                <a
                                  key={source.id}
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="border-border bg-surface text-muted-foreground hover:text-primary-strong inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs"
                                >
                                  <ExternalLink className="size-3" />{" "}
                                  {source.sourceDomain}
                                </a>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
      <ScheduleBuilder
        open={scheduleOpen}
        roadmapId={roadmap.id}
        onOpenChange={setScheduleOpen}
        onGenerated={() => {
          void queryClient.invalidateQueries({ queryKey: ["calendar"] });
          setView("daily");
        }}
      />
    </div>
  );
}
