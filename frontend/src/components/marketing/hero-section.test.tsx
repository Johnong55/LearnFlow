import { render, screen } from "@testing-library/react";

import { HeroSection } from "@/components/marketing/hero-section";

describe("HeroSection", () => {
  it("routes the primary CTA to account creation", () => {
    render(<HeroSection />);
    expect(
      screen.getByRole("link", { name: /build my roadmap/i }),
    ).toHaveAttribute("href", "/sign-up");
  });

  it("links the secondary CTA to the explainer", () => {
    render(<HeroSection />);
    expect(
      screen.getByRole("link", { name: /see how it works/i }),
    ).toHaveAttribute("href", "/#how-it-works");
  });
});
