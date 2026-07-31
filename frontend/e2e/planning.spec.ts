import { expect, test, type Page } from "@playwright/test";

const user = {
  id: "8f89bf67-b292-49c8-9bd1-769ae94eafba",
  email: "tri@example.com",
  role: "USER",
  onboardingCompletedAt: "2026-07-30T10:00:00.000Z",
  profile: {
    fullName: "Minh Trí",
    timezone: "Asia/Ho_Chi_Minh",
    locale: "vi-VN",
    occupation: "Developer",
    jobTitle: null,
  },
  preference: {},
};

const response = (data: unknown) => ({
  success: true,
  data,
  meta: { requestId: "planning-e2e", timestamp: new Date().toISOString() },
});

async function mockSession(page: Page) {
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response(user)),
    }),
  );
}

test("today page starts the next study session", async ({ page }) => {
  await mockSession(page);
  let started = false;
  const session = {
    kind: "STUDY_SESSION",
    id: "0b8794e4-9af0-40f4-b09d-d80bcd0fae86",
    taskId: "ce048933-6483-4fd8-8fb2-aa483128d578",
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 45 * 60_000).toISOString(),
    plannedMinutes: 45,
    actualMinutes: null,
    status: "SCHEDULED",
    source: "GENERATED",
    task: {
      id: "ce048933-6483-4fd8-8fb2-aa483128d578",
      title: "Học asynchronous JavaScript",
      description: "Promises và async/await",
      difficulty: "BEGINNER",
      estimatedMinutes: 90,
    },
  };
  await page.route("**/api/v1/calendar/day**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        response({
          from: session.startAt,
          to: session.endAt,
          items: [session],
        }),
      ),
    }),
  );
  await page.route("**/api/v1/routines", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response([])),
    }),
  );
  await page.route("**/api/v1/sessions/*/start", (route) => {
    started = true;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response({ ...session, status: "IN_PROGRESS" })),
    });
  });

  await page.goto("/app/today");
  await page.getByRole("button", { name: /Bắt đầu/ }).click();

  await expect.poll(() => started).toBe(true);
  await expect(page.getByText("Đã bắt đầu phiên học")).toBeVisible();
});

test("calendar previews a deterministic schedule before saving", async ({
  page,
}) => {
  await mockSession(page);
  await page.route("**/api/v1/calendar/week**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        response({
          from: new Date().toISOString(),
          to: new Date().toISOString(),
          items: [],
        }),
      ),
    }),
  );
  await page.route("**/api/v1/roadmaps", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        response([
          {
            id: "663eb7e5-4b9d-4394-96bd-da30946014f0",
            activeVersionNumber: 1,
            currentVersionNumber: 1,
          },
        ]),
      ),
    }),
  );
  await page.route("**/api/v1/schedules/preview", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        response({
          roadmapId: "663eb7e5-4b9d-4394-96bd-da30946014f0",
          roadmapVersion: 1,
          sessions: [
            {
              taskId: "task-1",
              taskTitle: "Promises và async/await",
              startAt: new Date().toISOString(),
              endAt: new Date(Date.now() + 45 * 60_000).toISOString(),
              plannedMinutes: 45,
            },
          ],
          unscheduledTasks: [],
          summary: {
            scheduledTasks: 1,
            scheduledSessions: 1,
            scheduledMinutes: 45,
            unscheduledTasks: 0,
          },
        }),
      ),
    }),
  );

  await page.goto("/app/calendar");
  await page.getByRole("button", { name: /Xếp lịch học/ }).click();
  await page.getByRole("button", { name: /Xem trước/ }).click();

  await expect(page.getByText("Promises và async/await")).toBeVisible();
  await expect(page.getByText("45", { exact: true }).first()).toBeVisible();
});

test("routine can be created through the accessible editor", async ({
  page,
}) => {
  await mockSession(page);
  let created = false;
  await page.route("**/api/v1/routines", (route) => {
    if (route.request().method() === "POST") {
      created = true;
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(
          response({ id: "routine-1", ...route.request().postDataJSON() }),
        ),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response([])),
    });
  });

  await page.goto("/app/routines");
  await page
    .getByRole("button", { name: /Thêm routine/ })
    .first()
    .click();
  await page.getByLabel("Tên hoạt động").fill("Đọc sách buổi tối");
  await page.getByRole("button", { name: "Lưu hoạt động" }).click();

  await expect.poll(() => created).toBe(true);
  await expect(page.getByText("Routine đã được lưu")).toBeVisible();
});

test("roadmap exposes add action and a concrete daily study plan", async ({
  page,
}) => {
  await mockSession(page);
  const roadmapId = "663eb7e5-4b9d-4394-96bd-da30946014f0";
  const taskId = "ce048933-6483-4fd8-8fb2-aa483128d578";
  const roadmap = {
    id: roadmapId,
    goalId: "e88fcff5-998d-45f0-962f-e4044126da7a",
    title: "Node.js Backend thực chiến",
    status: "ACTIVE",
    currentVersionNumber: 1,
    activeVersionNumber: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    goal: {
      id: "e88fcff5-998d-45f0-962f-e4044126da7a",
      title: "Xây REST API",
      status: "ACTIVE",
      skill: { id: "skill-node", name: "Node.js" },
    },
    versions: [
      {
        id: "version-1",
        version: 1,
        status: "ACTIVE",
        summary: "Học Node.js thông qua một REST API hoàn chỉnh.",
        estimatedWeeks: 8,
        weeklyHours: 6,
        difficulty: "BEGINNER",
        assumptions: [],
        prerequisites: [],
        milestones: [
          {
            id: "milestone-1",
            title: "Nền tảng bất đồng bộ",
            description: "Hiểu event loop trước khi xây API.",
            order: 1,
            estimatedHours: 6,
            modules: [
              {
                id: "module-1",
                title: "Promises và async/await",
                description: "Điều khiển luồng bất đồng bộ.",
                order: 1,
                estimatedHours: 3,
                sourceReferences: [],
                tasks: [
                  {
                    id: taskId,
                    title: "Vẽ và giải thích Node.js event loop",
                    description:
                      "Vẽ các phase chính, chạy ba đoạn code dự đoán thứ tự log và ghi lại kết quả.",
                    type: "LEARNING",
                    status: "PENDING",
                    order: 1,
                    estimatedMinutes: 45,
                    difficulty: "BEGINNER",
                    dependencies: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  await page.route("**/api/v1/roadmaps**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const data = pathname.endsWith(`/roadmaps/${roadmapId}`)
      ? roadmap
      : [roadmap];
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response(data)),
    });
  });
  await page.route("**/api/v1/calendar?**", (route) => {
    const startAt = new Date(Date.now() + 60 * 60_000).toISOString();
    const endAt = new Date(Date.now() + 105 * 60_000).toISOString();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        response({
          from: startAt,
          to: endAt,
          items: [
            {
              kind: "STUDY_SESSION",
              id: "session-daily-1",
              taskId,
              startAt,
              endAt,
              plannedMinutes: 45,
              actualMinutes: null,
              status: "SCHEDULED",
              source: "GENERATED",
              task: {
                id: taskId,
                title: "Vẽ và giải thích Node.js event loop",
                description:
                  "Vẽ các phase chính, chạy ba đoạn code dự đoán thứ tự log và ghi lại kết quả.",
                difficulty: "BEGINNER",
                estimatedMinutes: 45,
                module: {
                  milestone: { version: { roadmapId } },
                },
              },
            },
          ],
        }),
      ),
    });
  });

  await page.goto(`/app/roadmap?roadmapId=${roadmapId}`);
  await expect(page.getByRole("link", { name: /Thêm roadmap/ })).toBeVisible();
  await page.getByRole("button", { name: /Theo ngày/ }).click();

  await expect(page.getByText(/Ngày 1/)).toBeVisible();
  await expect(
    page.getByText("Vẽ và giải thích Node.js event loop"),
  ).toBeVisible();
  await expect(page.getByText(/chạy ba đoạn code/)).toBeVisible();
});
