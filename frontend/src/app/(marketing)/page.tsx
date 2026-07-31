import dynamic from "next/dynamic";

import { FinalCta } from "@/components/marketing/final-cta";
import { HeroSection } from "@/components/marketing/hero-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { ValueStrip } from "@/components/marketing/value-strip";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

const HowItWorks = dynamic(() =>
  import("@/components/marketing/how-it-works").then(
    (module) => module.HowItWorks,
  ),
);
const BalanceSection = dynamic(() =>
  import("@/components/marketing/balance-section").then(
    (module) => module.BalanceSection,
  ),
);
const RoadmapSection = dynamic(() =>
  import("@/components/marketing/roadmap-section").then(
    (module) => module.RoadmapSection,
  ),
);
const AdaptiveSection = dynamic(() =>
  import("@/components/marketing/adaptive-section").then(
    (module) => module.AdaptiveSection,
  ),
);
const ProductPreview = dynamic(() =>
  import("@/components/marketing/product-preview").then(
    (module) => module.ProductPreview,
  ),
);
const EmotionalSection = dynamic(() =>
  import("@/components/marketing/emotional-section").then(
    (module) => module.EmotionalSection,
  ),
);

export default function LandingPage() {
  return (
    <main>
      <ScrollProgress />
      <HeroSection />
      <ValueStrip />
      <ScrollReveal>
        <ProblemSection />
      </ScrollReveal>
      <HowItWorks />
      <ScrollReveal direction="right" distance={36}>
        <BalanceSection />
      </ScrollReveal>
      <RoadmapSection />
      <ScrollReveal direction="left" distance={36}>
        <AdaptiveSection />
      </ScrollReveal>
      <ScrollReveal distance={34}>
        <ProductPreview />
      </ScrollReveal>
      <ScrollReveal distance={24}>
        <EmotionalSection />
      </ScrollReveal>
      <ScrollReveal distance={24}>
        <FinalCta />
      </ScrollReveal>
    </main>
  );
}
