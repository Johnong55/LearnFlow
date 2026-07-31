"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Edit3,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { GoalEditorDialog } from "@/components/goals/goal-editor-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  goalsApi,
  type GoalStatus,
  type LearningGoal,
  type UpdateGoalInput,
} from "@/lib/api/goals.api";
import { isApiError } from "@/lib/api/errors";
import { roadmapsApi } from "@/lib/api/roadmaps.api";
import { queryKeys } from "@/lib/query/keys";

const statuses: Array<{ value: "ALL" | GoalStatus; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang học" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "COMPLETED", label: "Hoàn thành" },
];

const statusLabel: Record<GoalStatus, string> = {
  DRAFT: "Bản nháp",
  ANALYZING: "Đang phân tích",
  ACTIVE: "Đang học",
  PAUSED: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"ALL" | GoalStatus>("ALL");
  const [editing, setEditing] = useState<LearningGoal | null>(null);
  const goals = useQuery({
    queryKey: queryKeys.goals.all,
    queryFn: ({ signal }) => goalsApi.list(undefined, signal),
  });
  const roadmaps = useQuery({
    queryKey: queryKeys.roadmaps.all,
    queryFn: ({ signal }) => roadmapsApi.list(signal),
  });
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.overview }),
    ]);
  };
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGoalInput }) =>
      goalsApi.update(id, input),
    onSuccess: async () => {
      setEditing(null);
      toast.success("Mục tiêu đã được cập nhật");
      await invalidate();
    },
    onError: (error) =>
      toast.error(
        isApiError(error) ? error.message : "Không thể cập nhật mục tiêu.",
      ),
  });
  const transition = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "pause" | "resume" }) =>
      action === "pause" ? goalsApi.pause(id) : goalsApi.resume(id),
    onSuccess: async (goal) => {
      toast.success(
        goal.status === "PAUSED"
          ? "Đã tạm dừng mục tiêu"
          : "Đã tiếp tục mục tiêu",
      );
      await invalidate();
    },
    onError: (error) =>
      toast.error(
        isApiError(error) ? error.message : "Không thể thay đổi trạng thái.",
      ),
  });
  const remove = useMutation({
    mutationFn: (id: string) => goalsApi.delete(id),
    onSuccess: async () => {
      toast.success("Mục tiêu đã được xóa");
      await invalidate();
    },
    onError: (error) =>
      toast.error(
        isApiError(error) ? error.message : "Không thể xóa mục tiêu.",
      ),
  });
  const visible =
    goals.data?.filter((goal) => filter === "ALL" || goal.status === filter) ??
    [];
  const totalWeeklyHours =
    goals.data
      ?.filter(
        (goal) => goal.status === "ACTIVE" || goal.status === "ANALYZING",
      )
      .reduce((sum, goal) => sum + Number(goal.weeklyAvailableHours), 0) ?? 0;

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary-strong text-sm font-semibold">
            Mục tiêu học tập
          </p>
          <h1 className="font-display mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Điều bạn muốn đạt tới.
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            Điều chỉnh deadline và sức học theo thực tế. Mỗi goal giữ roadmap và
            tiến độ riêng, không ghi đè lên nhau.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/roadmap/new">
            <Plus className="size-4" /> Tạo mục tiêu
          </Link>
        </Button>
      </div>

      {goals.data?.length ? (
        <Card className="mt-7 flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="bg-primary-soft text-primary-strong grid size-11 place-items-center rounded-2xl">
              <Clock3 className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                Công suất mục tiêu đang hoạt động
              </p>
              <p className="text-muted-foreground text-xs">
                Tổng cam kết hiện tại của bạn
              </p>
            </div>
          </div>
          <strong className="font-display text-2xl">
            {totalWeeklyHours} giờ/tuần
          </strong>
        </Card>
      ) : null}

      <div
        className="mt-6 flex gap-2 overflow-x-auto pb-2"
        aria-label="Lọc mục tiêu"
      >
        {statuses.map((status) => (
          <Button
            key={status.value}
            size="sm"
            variant={filter === status.value ? "primary" : "secondary"}
            onClick={() => setFilter(status.value)}
          >
            {status.label}
          </Button>
        ))}
      </div>

      {goals.isPending ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : goals.isError ? (
        <Card className="mt-4 text-center">
          <p className="text-danger font-semibold">
            Không thể tải danh sách mục tiêu.
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => void goals.refetch()}
          >
            Thử lại
          </Button>
        </Card>
      ) : !visible.length ? (
        <Card className="mt-4 grid min-h-72 place-items-center text-center">
          <div>
            <Target className="text-primary mx-auto size-12" />
            <h2 className="font-display mt-4 text-3xl font-bold">
              {goals.data?.length
                ? "Không có mục tiêu ở trạng thái này"
                : "Bắt đầu bằng một đích đến rõ ràng"}
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-6">
              SkillPilot sẽ biến kết quả mong muốn thành roadmap và lịch học phù
              hợp với cuộc sống của bạn.
            </p>
            {!goals.data?.length ? (
              <Button asChild className="mt-5">
                <Link href="/app/roadmap/new">Tạo mục tiêu đầu tiên</Link>
              </Button>
            ) : null}
          </div>
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {visible.map((goal) => {
            const roadmap = roadmaps.data?.find(
              (item) => item.goalId === goal.id,
            );
            const canEdit =
              goal.status !== "COMPLETED" && goal.status !== "CANCELLED";
            return (
              <Card key={goal.id} className="flex flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge
                      tone={
                        goal.status === "ACTIVE"
                          ? "success"
                          : goal.status === "PAUSED"
                            ? "accent"
                            : goal.status === "ANALYZING"
                              ? "blue"
                              : "neutral"
                      }
                    >
                      {statusLabel[goal.status]}
                    </Badge>
                    <h2 className="font-display mt-4 text-2xl leading-tight font-bold">
                      {goal.title}
                    </h2>
                    <p className="text-primary-strong mt-1 text-xs font-bold">
                      {goal.skill.name}
                    </p>
                  </div>
                  <MoreHorizontal
                    className="text-muted-foreground size-5 shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-muted-foreground mt-4 line-clamp-3 text-sm leading-6">
                  {goal.description}
                </p>
                <div className="border-border mt-5 grid grid-cols-2 gap-3 border-y py-4 text-sm">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="text-info size-4" />{" "}
                    {format(new Date(goal.targetDate), "dd MMM yyyy", {
                      locale: vi,
                    })}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 className="text-primary size-4" />{" "}
                    {Number(goal.weeklyAvailableHours)} giờ/tuần
                  </span>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  {roadmap ? (
                    <Button asChild size="sm">
                      <Link href={`/app/roadmap?roadmapId=${roadmap.id}`}>
                        Mở roadmap <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  ) : goal.status === "DRAFT" ? (
                    <Button asChild size="sm">
                      <Link href={`/app/roadmap/generating?goalId=${goal.id}`}>
                        <Sparkles className="size-3.5" /> Tạo roadmap
                      </Link>
                    </Button>
                  ) : null}
                  {canEdit ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditing(goal)}
                    >
                      <Edit3 className="size-3.5" /> Sửa
                    </Button>
                  ) : null}
                  {goal.status === "ACTIVE" || goal.status === "ANALYZING" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={transition.isPending}
                      onClick={() =>
                        transition.mutate({ id: goal.id, action: "pause" })
                      }
                    >
                      <Pause className="size-3.5" /> Tạm dừng
                    </Button>
                  ) : goal.status === "PAUSED" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={transition.isPending}
                      onClick={() =>
                        transition.mutate({ id: goal.id, action: "resume" })
                      }
                    >
                      <Play className="size-3.5" /> Tiếp tục
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:bg-coral-soft"
                    loading={remove.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Xóa mục tiêu “${goal.title}”? Roadmap liên quan cũng sẽ không còn hiển thị.`,
                        )
                      )
                        remove.mutate(goal.id);
                    }}
                  >
                    <Trash2 className="size-3.5" /> Xóa
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <GoalEditorDialog
        goal={editing}
        open={Boolean(editing)}
        saving={update.isPending}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSave={(input) => {
          if (editing) update.mutate({ id: editing.id, input });
        }}
      />
    </div>
  );
}
