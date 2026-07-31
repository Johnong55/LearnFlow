"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { AppLogo } from "@/components/layout/app-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GlobalError({
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
    <main className="page-shell grid min-h-screen place-items-center py-16">
      <Card className="w-full max-w-lg p-8 text-center sm:p-10">
        <AppLogo className="mb-8 justify-center" />
        <span className="bg-coral-soft text-danger mx-auto mb-5 grid size-14 place-items-center rounded-2xl">
          <AlertTriangle aria-hidden="true" />
        </span>
        <h1 className="font-display text-3xl font-bold">
          Trang này vừa gặp trục trặc
        </h1>
        <p className="text-muted-foreground mt-4 leading-7">
          Dữ liệu của bạn vẫn an toàn. Hãy tải lại phần này hoặc quay lại sau ít
          phút.
        </p>
        <Button className="mt-7 w-full" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Thử lại
        </Button>
      </Card>
    </main>
  );
}
