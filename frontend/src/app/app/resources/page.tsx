"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  Globe2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { roadmapsApi } from "@/lib/api/roadmaps.api";
import { queryKeys } from "@/lib/query/keys";

function scoreLabel(value: number | string): string {
  const score = Number(value);
  return `${Math.round((score <= 1 ? score * 100 : score) || 0)}%`;
}

export default function ResourcesPage() {
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const roadmaps = useQuery({
    queryKey: queryKeys.roadmaps.all,
    queryFn: ({ signal }) => roadmapsApi.list(signal),
  });
  const roadmapId = selectedId || roadmaps.data?.[0]?.id || "";
  const sources = useQuery({
    queryKey: queryKeys.roadmaps.sources(roadmapId || "pending"),
    queryFn: ({ signal }) => roadmapsApi.sources(roadmapId, signal),
    enabled: Boolean(roadmapId),
  });
  const visible = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    if (!keyword) return sources.data ?? [];
    return (sources.data ?? []).filter((source) =>
      [source.title, source.description, source.sourceDomain]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("vi").includes(keyword)),
    );
  }, [search, sources.data]);

  return (
    <div>
      <div>
        <p className="text-primary-strong text-sm font-semibold">
          Nguồn học tập
        </p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          Biết roadmap đến từ đâu.
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
          Đây là các nguồn thật do backend tìm và lưu khi tạo roadmap.
          SkillPilot không tự phát minh URL hoặc thay thế nội dung gốc.
        </p>
      </div>

      {roadmaps.isPending ? (
        <Skeleton className="mt-8 h-28" />
      ) : roadmaps.isError ? (
        <Card className="mt-8 text-center">
          <p className="text-danger font-semibold">Không thể tải roadmap.</p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => void roadmaps.refetch()}
          >
            Thử lại
          </Button>
        </Card>
      ) : !roadmaps.data?.length ? (
        <Card className="mt-8 grid min-h-72 place-items-center text-center">
          <div>
            <BookOpen className="text-primary mx-auto size-12" />
            <h2 className="font-display mt-4 text-3xl font-bold">
              Chưa có thư viện nguồn
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Nguồn tham khảo sẽ được lưu khi roadmap đầu tiên được tạo.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card className="mt-8 grid gap-4 p-5 md:grid-cols-2">
            <SelectField
              label="Roadmap"
              value={roadmapId}
              onChange={(event) => setSelectedId(event.target.value)}
              options={roadmaps.data.map((roadmap) => ({
                value: roadmap.id,
                label: roadmap.title,
              }))}
            />
            <Input
              label="Tìm trong nguồn"
              placeholder="Tên bài viết, website…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              trailing={<Search className="text-muted-foreground size-4" />}
            />
          </Card>

          {sources.isPending ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : sources.isError ? (
            <Card className="mt-5 text-center">
              <p className="text-danger font-semibold">
                Không thể tải nguồn của roadmap này.
              </p>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => void sources.refetch()}
              >
                Thử lại
              </Button>
            </Card>
          ) : !visible.length ? (
            <Card className="mt-5 grid min-h-64 place-items-center text-center">
              <div>
                <FileText className="text-muted-foreground mx-auto size-10" />
                <h2 className="font-display mt-4 text-2xl font-bold">
                  {search
                    ? "Không tìm thấy nguồn phù hợp"
                    : "Roadmap này chưa lưu nguồn"}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  {search
                    ? "Thử một từ khóa khác."
                    : "Có thể roadmap được tạo bằng mock provider trong môi trường phát triển."}
                </p>
              </div>
            </Card>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {visible.map((source) => (
                <Card key={source.id} className="flex flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="bg-info-soft text-info grid size-11 shrink-0 place-items-center rounded-2xl">
                      <Globe2 className="size-5" />
                    </span>
                    <Badge tone="neutral">
                      {source.contentType.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <h2 className="mt-5 text-lg leading-6 font-bold">
                    {source.title}
                  </h2>
                  <p className="text-primary-strong mt-1 text-xs font-semibold">
                    {source.sourceDomain}
                  </p>
                  <p className="text-muted-foreground mt-3 line-clamp-3 text-sm leading-6">
                    {source.description ??
                      "Nguồn tham khảo được liên kết với các module trong roadmap."}
                  </p>
                  <div className="border-border mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-xs">
                    <span>
                      <span className="text-muted-foreground block">
                        Liên quan
                      </span>
                      <strong>{scoreLabel(source.relevanceScore)}</strong>
                    </span>
                    <span>
                      <span className="text-muted-foreground block">
                        Độ tin cậy
                      </span>
                      <strong className="inline-flex items-center gap-1">
                        <ShieldCheck className="text-success size-3.5" />{" "}
                        {scoreLabel(source.credibilityScore)}
                      </strong>
                    </span>
                  </div>
                  <Button asChild variant="secondary" className="mt-5 w-full">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Mở nguồn gốc <ArrowUpRight className="size-4" />
                    </a>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
