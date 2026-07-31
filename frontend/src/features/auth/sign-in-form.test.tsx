import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { SignInForm } from "@/features/auth/sign-in-form";
import { authApi } from "@/lib/api/auth.api";
import { renderWithProviders } from "@/tests/test-utils";

const replace = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/lib/api/auth.api", () => ({
  authApi: { signIn: vi.fn() },
}));

describe("SignInForm", () => {
  it("shows client-side validation before sending a request", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(
      await screen.findByText("Hãy nhập một địa chỉ email hợp lệ."),
    ).toBeVisible();
    expect(screen.getByText("Hãy nhập mật khẩu.")).toBeVisible();
    expect(authApi.signIn).not.toHaveBeenCalled();
  });

  it("allows keyboard users to reveal and hide the password", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);
    const password = screen.getByLabelText("Mật khẩu");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(password).toHaveAttribute("type", "text");
  });
});
