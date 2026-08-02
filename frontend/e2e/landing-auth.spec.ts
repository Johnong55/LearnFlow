import { expect, test } from "@playwright/test";

const response = (data: unknown) => ({
  success: true,
  data,
  meta: { requestId: "landing-e2e", timestamp: new Date().toISOString() },
});

async function mockGuest(page: import("@playwright/test").Page) {
  for (const endpoint of ["me", "refresh"]) {
    await page.route(`**/api/v1/auth/${endpoint}`, (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Not signed in" },
          meta: {
            requestId: "landing-e2e",
            timestamp: new Date().toISOString(),
          },
        }),
      }),
    );
  }
}

test("landing primary CTA opens sign-up", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /turn the skills you want/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Build my roadmap" }).first().click();
  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(
    page.getByRole("heading", { name: /build a plan you can keep/i }),
  ).toBeVisible();
});

test("sign-up reports accessible validation errors", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(
    page.getByText("Hãy nhập một địa chỉ email hợp lệ."),
  ).toBeVisible();
  await expect(page.getByText("Mật khẩu cần ít nhất 12 ký tự.")).toBeVisible();
});

test("mobile navigation opens and reaches sign-in", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile-only navigation behavior");
  await page.goto("/");
  await page.getByRole("button", { name: "Mở menu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("link", { name: "Sign in" }).last().click();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("authenticated landing header opens the workspace instead of sign-in", async ({
  page,
  isMobile,
}) => {
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        response({
          id: "8f89bf67-b292-49c8-9bd1-769ae94eafba",
          email: "tri@example.com",
          role: "USER",
          onboardingCompletedAt: "2026-07-30T10:00:00.000Z",
          profile: {
            fullName: "Minh Trí",
            timezone: "Asia/Ho_Chi_Minh",
            locale: "vi-VN",
            occupation: null,
            jobTitle: null,
          },
          preference: null,
        }),
      ),
    }),
  );
  await page.goto("/");

  if (isMobile) await page.getByRole("button", { name: "Mở menu" }).click();

  await expect(
    page.getByRole("link", { name: "Vào ứng dụng" }).last(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
});

test("adaptive schedule demo moves Wednesday learning to Saturday", async ({
  page,
}) => {
  await mockGuest(page);
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Miss Wednesday session" });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  await expect(page.getByText("Node.js · 09:00")).toBeVisible();
  await expect(page.getByText(/Saturday morning was selected/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Reset demo/ })).toBeVisible();
});

test("product preview tabs support arrow-key navigation", async ({ page }) => {
  await mockGuest(page);
  await page.goto("/");
  const today = page.getByRole("tab", { name: "Today" });
  await today.scrollIntoViewIfNeeded();
  await today.focus();
  await today.press("ArrowRight");

  await expect(page.getByRole("tab", { name: "Roadmap" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tabpanel")).toBeVisible();
});

test("landing page has no horizontal overflow", async ({ page }) => {
  await mockGuest(page);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /turn the skills you want/i }),
  ).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("landing page respects reduced-motion preference", async ({ page }) => {
  await mockGuest(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect
    .poll(() =>
      page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    )
    .toBe(true);
  await expect(
    page.getByRole("heading", { name: /turn the skills you want/i }),
  ).toBeVisible();
});
