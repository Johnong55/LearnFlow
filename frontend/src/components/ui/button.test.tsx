import { render, screen } from "@testing-library/react";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("keeps the action disabled and announces loading", () => {
    render(
      <Button loading loadingLabel="Đang lưu...">
        Lưu
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Đang lưu..." });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("supports disabled state", () => {
    render(<Button disabled>Không khả dụng</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
