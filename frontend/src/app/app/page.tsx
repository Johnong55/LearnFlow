"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Route,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { roadmapsApi } from "@/lib/api/roadmaps.api";
import { queryKeys } from "@/lib/query/keys";
import { useAuthStore } from "@/stores/auth-store";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const roadmaps = useQuery({
    queryKey: queryKeys.roadmaps.all,
    queryFn: ({ signal }) => roadmapsApi.list(signal),
  });
  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? "Chào buổi sáng"
      : hour < 18
        ? "Chào buổi chiều"
        : "Chào buổi tối";
  const firstName =
    user?.profile?.fullName?.trim().split(/\s+/).at(-1) ?? "bạn";
  const current =
    roadmaps.data?.find((roadmap) => roadmap.status === "ACTIVE") ??
    roadmaps.data?.[0];
  const version = current?.versions[0];

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary-strong text-sm font-semibold">
            {greeting}, {firstName}.
          </p>
          <h1 className="font-display mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Sẵn sàng cho một bước có ý nghĩa?
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            Không cần học thật nhiều hôm nay. Chỉ cần tiếp tục đúng phần quan
            trọng tiếp theo.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/app/roadmap">
            <Route className="size-4" /> Mở roadmap
          </Link>
        </Button>
      </div>

      {roadmaps.isPending ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-56 lg:col-span-2" />
          <Skeleton className="h-56" />
        </div>
      ) : roadmaps.isError ? (
        <Card className="mt-8 text-center">
          <p className="text-danger font-semibold">
            Không thể tải không gian học tập.
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => void roadmaps.refetch()}
          >
            Thử lại
          </Button>
        </Card>
      ) : current ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Card className="bg-primary-deep text-background overflow-hidden p-7 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <span className="bg-primary/20 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold">
                <Sparkles className="size-3.5" /> Roadmap hiện tại
              </span>
              <span className="text-xs opacity-65">
                Phiên bản {current.currentVersionNumber ?? "—"}
              </span>
            </div>
            <h2 className="font-display mt-6 text-3xl font-bold sm:text-4xl">
              {current.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-75">
              {version?.summary ?? `Mục tiêu: ${current.goal.title}`}
            </p>
            <div className="mt-7 flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-2">
                <CalendarClock className="text-primary size-4" />{" "}
                {version?.estimatedWeeks ?? "—"} tuần
              </span>
              <span className="flex items-center gap-2">
                <Clock3 className="text-primary size-4" />{" "}
                {version?.weeklyHours ?? "—"} giờ/tuần
              </span>
            </div>
            <Button asChild className="mt-7">
              <Link href={`/app/roadmap?roadmapId=${current.id}`}>
                Khám phá lộ trình <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Card>
          <Card>
            <span className="bg-success-soft text-success grid size-12 place-items-center rounded-2xl">
              <BookOpenCheck className="size-6" />
            </span>
            <h2 className="font-display mt-5 text-2xl font-bold">
              Nền tảng đã sẵn sàng
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Roadmap đã được tạo. Phiên tiếp theo sẽ bổ sung lịch học hôm nay,
              calendar và tiến độ chi tiết.
            </p>
            <div className="border-border mt-6 flex items-center gap-3 border-t pt-5">
              <CheckCircle2 className="text-success size-5" />
              <span className="text-sm font-semibold">
                Hồ sơ cuộc sống đã được bảo vệ
              </span>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="mt-8 grid min-h-80 place-items-center text-center">
          <div>
            <span className="bg-primary-soft text-primary-strong mx-auto grid size-16 place-items-center rounded-3xl">
              <Route className="size-8" />
            </span>
            <h2 className="font-display mt-5 text-3xl font-bold">
              Chưa có roadmap nào
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-6">
              Tạo một mục tiêu rõ ràng để SkillPilot xây lộ trình học đầu tiên
              quanh lịch sống của bạn.
            </p>
            <Button asChild className="mt-6">
              <Link href="/onboarding/skills">
                Tạo roadmap đầu tiên <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
