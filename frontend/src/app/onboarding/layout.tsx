import type { Metadata } from "next";
import type { ReactNode } from "react";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export const metadata: Metadata = {
  title: "Thiết lập kế hoạch",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <OnboardingShell>{children}</OnboardingShell>;
}
