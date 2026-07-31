import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";

import { AppLogo } from "@/components/layout/app-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="page-shell grid min-h-screen place-items-center py-16 text-center">
      <div className="max-w-xl">
        <AppLogo className="mb-10 justify-center" />
        <div className="bg-primary-soft text-primary-deep mx-auto mb-7 grid size-20 place-items-center rounded-[28px]">
          <Compass className="size-9" aria-hidden="true" />
        </div>
        <p className="font-display text-primary-strong mb-3 text-lg">
          404 · Lạc một nhịp rồi
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Không tìm thấy đường dẫn này.
        </h1>
        <p className="text-muted-foreground mx-auto mt-5 max-w-md leading-7">
          Có thể trang đã được di chuyển. Hãy quay về để tiếp tục xây kế hoạch
          học tập của bạn.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Về trang chủ
          </Link>
        </Button>
      </div>
    </main>
  );
}
