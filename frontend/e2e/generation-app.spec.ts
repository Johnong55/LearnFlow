import { expect, test, type Page } from "@playwright/test";

const completedUser = {
  id: "8f89bf67-b292-49c8-9bd1-769ae94eafba",
  email: "tri@example.com",
  role: "USER",
  onboardingCompletedAt: "2026-07-30T10:00:00.000Z",
  profile: {
    fullName: "Minh Trí",
    timezone: "Asia/Ho_Chi_Minh",
    locale: "vi-VN",
    occupation: "Backend Developer",
    jobTitle: null,
  },
  preference: {},
};

const response = (data: unknown) => ({
  success: true,
  data,
  meta: { requestId: "e2e-request", timestamp: new Date().toISOString() },
});

const job = (status: "RUNNING" | "COMPLETED" | "FAILED") => ({
  jobId: "9ee506b2-b63d-43b1-8621-bdbbb54dba51",
  status,
  progress: status === "COMPLETED" ? 100 : status === "FAILED" ? 65 : 15,
  message:
    status === "COMPLETED"
      ? "Roadmap completed."
      : status === "FAILED"
        ? "Roadmap generation failed."
        : "Searching learning resources...",
  error:
    status === "FAILED"
      ? {
          code: "ROADMAP_PERSONALIZATION_FAILED",
          message: "Nhà cung cấp AI tạm thời không phản hồi.",
        }
      : null,
  result:
    status === "COMPLETED"
      ? {
          version: 1,
          roadmapId: "663eb7e5-4b9d-4394-96bd-da30946014f0",
          versionId: "bb58abdc-8fa1-4bc2-ab5b-2b1220a157e9",
        }
      : null,
  retryCount: 0,
  createdAt: "2026-07-30T10:00:00.000Z",
  updatedAt: "2026-07-30T10:01:00.000Z",
});

async function mockSession(page: Page) {
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response(completedUser)),
    }),
  );
}

test("generation page follows real backend job progress", async ({ page }) => {
  await mockSession(page);
  await page.route("**/api/v1/goals/*/generate-roadmap", (route) =>
    route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify(response(job("RUNNING"))),
    }),
  );
  await page.route("**/api/v1/roadmap-jobs/*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response(job("COMPLETED"))),
    }),
  );

  await page.goto(
    "/onboarding/generating?goalId=ebd865de-89a8-427b-8512-46ae6e1889e5",
  );

  await expect(
    page.getByRole("heading", { name: "Roadmap của bạn đã sẵn sàng." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Khám phá kế hoạch của tôi/ }),
  ).toHaveAttribute("href", /\/app\/roadmap\?roadmapId=/);
});

test("failed generation job can be retried", async ({ page }) => {
  await mockSession(page);
  let retried = false;
  await page.route("**/api/v1/roadmap-jobs/**", (route) => {
    if (route.request().method() === "POST") {
      retried = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response(job("RUNNING"))),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response(job("FAILED"))),
    });
  });

  await page.goto(
    "/onboarding/generating?goalId=ebd865de-89a8-427b-8512-46ae6e1889e5&jobId=9ee506b2-b63d-43b1-8621-bdbbb54dba51",
  );
  await page.getByRole("button", { name: /Thử lại/ }).click();

  await expect.poll(() => retried).toBe(true);
  await expect(page.getByText("Đang thử tạo lại roadmap")).toBeVisible();
});

test("completed user signs in to the protected app", async ({ page }) => {
  await page.route("**/api/v1/auth/login", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        response({
          user: completedUser,
          tokens: {
            accessToken: "access-token",
            refreshToken: "refresh-token",
            expiresIn: 900,
          },
        }),
      ),
    }),
  );
  await page.route("**/api/v1/roadmaps", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response([])),
    }),
  );

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("tri@example.com");
  await page.locator('input[name="password"]').fill("very-secret-password");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("heading", { name: /Sẵn sàng cho một bước có ý nghĩa/ }),
  ).toBeVisible();
});
