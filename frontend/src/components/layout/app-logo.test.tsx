import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppLogo } from "@/components/layout/app-logo";

describe("AppLogo", () => {
  it("links to the requested application destination", () => {
    render(<AppLogo href="/app" destinationLabel="Tổng quan" compact />);

    expect(
      screen.getByRole("link", { name: /SkillPilot — Tổng quan/i }),
    ).toHaveAttribute("href", "/app");
  });
});
