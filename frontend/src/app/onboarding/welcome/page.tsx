import {
  ArrowRight,
  BriefcaseBusiness,
  MoonStar,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { StepCard } from "@/components/onboarding/step-card";
import { Button } from "@/components/ui/button";

const promises = [
  {
    icon: BriefcaseBusiness,
    title: "Tôn trọng công việc",
    text: "Giờ làm và di chuyển luôn được tính trước.",
  },
  {
    icon: MoonStar,
    title: "Bảo vệ giấc ngủ",
    text: "Không đánh đổi sức khỏe để học nhiều hơn.",
  },
  {
    icon: RefreshCw,
    title: "Kế hoạch biết thích nghi",
    text: "Lịch có thể cân bằng lại khi cuộc sống thay đổi.",
  },
];

export default function OnboardingWelcomePage() {
  return (
    <StepCard
      eyebrow="Khoảng 6–8 phút"
      title="Hãy tạo một kế hoạch bạn có thể duy trì."
      description="Chúng mình sẽ hỏi về mục tiêu, công việc và nhịp sống của bạn. Mọi thứ đều có thể chỉnh lại sau."
    >
      <div className="grid gap-3 md:grid-cols-3">
        {promises.map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-surface-muted rounded-[22px] p-5">
            <span className="bg-primary-soft text-primary-strong mb-4 grid size-11 place-items-center rounded-2xl">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              {text}
            </p>
          </div>
        ))}
      </div>
      <div className="border-primary/20 bg-primary-soft mt-6 flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6">
        <ShieldCheck
          className="text-primary-strong mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />
        <p>
          <strong>Không cần lịch hoàn hảo.</strong> Hãy nhập một tuần điển hình;
          SkillPilot sẽ giúp bạn xử lý những ngày ngoại lệ sau.
        </p>
      </div>
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost">
          <Link href="/">Tôi sẽ làm sau</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/onboarding/about-you">
            Bắt đầu <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </StepCard>
  );
}
