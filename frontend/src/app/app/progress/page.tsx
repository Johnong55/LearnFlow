"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Activity,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  aggregateProgressDays,
  minutesLabel,
} from "@/features/progress/progress-utils";
import { progressApi, type ProgressPace } from "@/lib/api/progress.api";
import { queryKeys } from "@/lib/query/keys";

const paceLabel: Record<ProgressPace, string> = {
  AHEAD: "Nhanh hơn kế hoạch",
  ON_TRACK: "Đúng tiến độ",
  DELAYED: "Cần điều chỉnh",
};

function percent(value: number): string {
  return `${Math.round(value)}%`;
}

export default function ProgressPage() {
  const progress = useQuery({
    queryKey: queryKeys.progress.overview,
    queryFn: ({ signal }) => progressApi.overview(signal),
  });
  const days = useMemo(
    () =>
      aggregateProgressDays(
        progress.data?.goals.map((item) => item.metrics.weekly) ?? [],
      ),
    [progress.data],
  );
  const totals = progress.data?.totals;
  const taskRate = totals?.totalTasks
    ? (totals.completedTasks / totals.totalTasks) * 100
    : 0;
  const actualRate = totals?.plannedLearningMinutes
    ? Math.min(
        100,
        (totals.actualLearningMinutes / totals.plannedLearningMinutes) * 100,
      )
    : 0;

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary-strong text-sm font-semibold">
            Tiến độ thực tế
          </p>
          <h1 className="font-display mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Nhìn lại để bước tiếp nhẹ hơn.
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            So sánh thời gian dự kiến và thực tế, theo dõi nhịp học mà không tạo
            áp lực từ những ngày bạn cần nghỉ.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/app/calendar">
            Xem lịch tuần <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {progress.isPending ? (
        <div className="mt-8 space-y-5" aria-label="Đang tải tiến độ">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-36" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      ) : progress.isError ? (
        <Card className="mt-8 text-center">
          <Activity className="text-danger mx-auto size-10" />
          <h2 className="font-display mt-4 text-2xl font-bold">
            Chưa thể tải tiến độ
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Dữ liệu của bạn vẫn an toàn. Hãy thử kết nối lại với máy chủ.
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            onClick={() => void progress.refetch()}
          >
            Thử lại
          </Button>
        </Card>
      ) : !progress.data?.goals.length ? (
        <Card className="mt-8 grid min-h-80 place-items-center text-center">
          <div>
            <TrendingUp className="text-primary mx-auto size-12" />
            <h2 className="font-display mt-4 text-3xl font-bold">
              Tiến độ sẽ xuất hiện tại đây
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-6">
              Bắt đầu một roadmap và hoàn thành phiên học đầu tiên để có dữ liệu
              so sánh hữu ích.
            </p>
            <Button asChild className="mt-5">
              <Link href="/app/roadmap/new">Tạo mục tiêu đầu tiên</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <section
            className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Chỉ số tổng quan"
          >
            <MetricCard
              icon={Clock3}
              label="Thời gian đã học"
              value={minutesLabel(totals?.actualLearningMinutes ?? 0)}
              detail={`${percent(actualRate)} thời lượng đã lên lịch`}
              tone="primary"
            />
            <MetricCard
              icon={CheckCircle2}
              label="Nhiệm vụ hoàn thành"
              value={`${totals?.completedTasks ?? 0}/${totals?.totalTasks ?? 0}`}
              detail={`${percent(taskRate)} toàn bộ roadmap`}
              tone="success"
            />
            <MetricCard
              icon={CalendarCheck2}
              label="Thời gian dự kiến"
              value={minutesLabel(totals?.plannedLearningMinutes ?? 0)}
              detail="Tổng các phiên đang được theo dõi"
              tone="blue"
            />
            <MetricCard
              icon={Target}
              label="Mục tiêu đang theo dõi"
              value={String(progress.data.goals.length)}
              detail="Mỗi mục tiêu có nhịp tiến độ riêng"
              tone="accent"
            />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
            <Card className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold">
                    7 ngày gần đây
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Phút học dự kiến và thời gian bạn thực sự hoàn thành.
                  </p>
                </div>
                <div className="flex gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <i className="bg-info block size-2.5 rounded-full" /> Dự
                    kiến
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="bg-primary block size-2.5 rounded-full" />{" "}
                    Thực tế
                  </span>
                </div>
              </div>
              <div
                className="mt-6 h-64"
                role="img"
                aria-label="Biểu đồ thời gian học trong bảy ngày gần đây"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={days} barGap={4}>
                    <CartesianGrid
                      stroke="var(--border)"
                      strokeDasharray="4 6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value: string) =>
                        format(parseISO(value), "EEE", { locale: vi })
                      }
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={34}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--surface-muted)" }}
                      contentStyle={{
                        border: "1px solid var(--border)",
                        borderRadius: "16px",
                        background: "var(--surface)",
                        color: "var(--foreground)",
                      }}
                      labelFormatter={(label) =>
                        format(parseISO(String(label)), "EEEE, dd/MM", {
                          locale: vi,
                        })
                      }
                      formatter={(value, name) => [
                        `${Number(value)} phút`,
                        name === "plannedMinutes" ? "Dự kiến" : "Thực tế",
                      ]}
                    />
                    <Bar
                      dataKey="plannedMinutes"
                      fill="var(--info)"
                      radius={[7, 7, 2, 2]}
                      maxBarSize={24}
                    />
                    <Bar
                      dataKey="actualMinutes"
                      fill="var(--primary)"
                      radius={[7, 7, 2, 2]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="sr-only">
                {days.map((day) => (
                  <p key={day.date}>
                    {day.date}: dự kiến {day.plannedMinutes} phút, thực tế{" "}
                    {day.actualMinutes} phút.
                  </p>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="font-display text-2xl font-bold">
                Theo từng mục tiêu
              </h2>
              <div className="mt-5 space-y-4">
                {progress.data.goals.map(({ goal, roadmapId, metrics }) => (
                  <article
                    key={goal.id}
                    className="border-border rounded-2xl border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{goal.title}</h3>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {metrics.completedTasks}/{metrics.totalTasks} nhiệm vụ
                        </p>
                      </div>
                      <Badge
                        tone={
                          metrics.pace === "DELAYED"
                            ? "coral"
                            : metrics.pace === "AHEAD"
                              ? "blue"
                              : "success"
                        }
                      >
                        {paceLabel[metrics.pace]}
                      </Badge>
                    </div>
                    <div className="bg-surface-muted mt-4 h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-[width] duration-500"
                        style={{
                          width: `${Math.min(100, metrics.taskCompletionRate)}%`,
                        }}
                      />
                    </div>
                    <div className="text-muted-foreground mt-3 flex items-center justify-between text-xs">
                      <span>
                        {percent(metrics.taskCompletionRate)} hoàn thành
                      </span>
                      <span>
                        Dự kiến{" "}
                        {format(
                          new Date(metrics.estimatedCompletionDate),
                          "dd/MM/yyyy",
                        )}
                      </span>
                    </div>
                    {roadmapId ? (
                      <Link
                        href={`/app/roadmap?roadmapId=${roadmapId}`}
                        className="text-primary-strong mt-4 inline-flex items-center gap-1 text-xs font-bold hover:underline"
                      >
                        Mở roadmap <ArrowRight className="size-3.5" />
                      </Link>
                    ) : null}
                  </article>
                ))}
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  detail: string;
  tone: "primary" | "success" | "blue" | "accent";
}) {
  const toneClass = {
    primary: "bg-primary-soft text-primary-strong",
    success: "bg-success-soft text-success",
    blue: "bg-info-soft text-info",
    accent: "bg-accent-soft text-warning",
  }[tone];
  return (
    <Card className="p-5">
      <span
        className={`grid size-11 place-items-center rounded-2xl ${toneClass}`}
      >
        <Icon className="size-5" />
      </span>
      <p className="text-muted-foreground mt-4 text-xs font-semibold">
        {label}
      </p>
      <p className="font-display mt-1 text-3xl font-bold">{value}</p>
      <p className="text-muted-foreground mt-2 text-xs leading-5">{detail}</p>
    </Card>
  );
}
