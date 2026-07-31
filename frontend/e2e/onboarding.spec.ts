import { expect, test } from "@playwright/test";

const user = {
  id: "8f89bf67-b292-49c8-9bd1-769ae94eafba",
  email: "tri@example.com",
  role: "USER",
  onboardingCompletedAt: null,
  profile: {
    fullName: "Minh Trí",
    timezone: "Asia/Ho_Chi_Minh",
    locale: "vi-VN",
    occupation: null,
    jobTitle: null,
  },
  preference: null,
};

const response = (data: unknown) => ({
  success: true,
  data,
  meta: { requestId: "e2e-request", timestamp: new Date().toISOString() },
});

test("authenticated user can begin onboarding and save the about step", async ({
  page,
}) => {
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response(user)),
    }),
  );
  await page.route("**/api/v1/users/me", async (route) => {
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        response({ ...user, profile: { ...user.profile, ...payload } }),
      ),
    });
  });

  await page.goto("/onboarding/welcome");
  await expect(
    page.getByRole("heading", {
      name: "Hãy tạo một kế hoạch bạn có thể duy trì.",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Bắt đầu/ }).click();
  await expect(
    page.getByRole("heading", { name: "Một chút về bạn" }),
  ).toBeVisible();

  await page.getByLabel("Tên hiển thị").fill("Minh Trí");
  await page.getByLabel("Công việc hiện tại").fill("Backend Developer");
  await page.getByRole("button", { name: /Tiếp tục/ }).click();

  await expect(page).toHaveURL(/\/onboarding\/work$/);
  await expect(
    page.getByRole("heading", {
      name: "Tuần làm việc của bạn trông như thế nào?",
    }),
  ).toBeVisible();
});
