import type { ReactNode } from "react";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
