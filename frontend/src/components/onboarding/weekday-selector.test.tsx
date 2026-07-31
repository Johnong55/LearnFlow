import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { WeekdaySelector } from "@/components/onboarding/weekday-selector";
import { renderWithProviders } from "@/tests/test-utils";

describe("WeekdaySelector", () => {
  it("lets keyboard and pointer users toggle a weekday", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <WeekdaySelector value={["MONDAY"]} onChange={onChange} />,
    );

    const monday = screen.getByRole("button", { name: "T2" });
    expect(monday).toHaveAttribute("aria-pressed", "true");
    await user.click(monday);

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
