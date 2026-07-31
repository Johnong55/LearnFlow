import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { SignUpForm } from "@/features/auth/sign-up-form";
import { renderWithProviders } from "@/tests/test-utils";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/lib/api/auth.api", () => ({ authApi: { signUp: vi.fn() } }));

describe("SignUpForm", () => {
  it("rejects a short password and missing agreement", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUpForm />);
    await user.type(screen.getByLabelText("Tên hiển thị"), "Trí");
    await user.type(screen.getByLabelText("Email"), "tri@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "too-short");
    await user.type(screen.getByLabelText("Nhập lại mật khẩu"), "too-short");
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(
      await screen.findByText("Mật khẩu cần ít nhất 12 ký tự."),
    ).toBeVisible();
    expect(
      screen.getByText("Bạn cần đồng ý với điều khoản để tiếp tục."),
    ).toBeVisible();
  });
});
