"use client";

import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto grid min-h-[30rem] max-w-2xl place-items-center text-center">
      <div>
        <span className="bg-coral-soft text-danger mx-auto grid size-16 place-items-center rounded-[24px]">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="font-display mt-6 text-3xl font-bold">
          Phần này chưa thể hiển thị
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-7">
          Dữ liệu của bạn vẫn an toàn. Hãy thử tải lại phần này hoặc quay về
          tổng quan.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>
            <RotateCcw className="size-4" /> Thử lại
          </Button>
          <Button asChild variant="secondary">
            <Link href="/app">
              <Home className="size-4" /> Về tổng quan
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
