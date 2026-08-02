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

test("focus mode supports start, pause, resume and reflective completion", async ({
  page,
}) => {
  await mockSession(page);
  let started = false;
  let paused = false;
  let completionPayload: Record<string, unknown> | null = null;
  const session = {
    kind: "STUDY_SESSION",
    id: "0b8794e4-9af0-40f4-b09d-d80bcd0fae86",
    taskId: "ce048933-6483-4fd8-8fb2-aa483128d578",
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 45 * 60_000).toISOString(),
    plannedMinutes: 45,
    actualMinutes: null,
    startedAt: null,
    lastResumedAt: null,
    pausedAt: null,
    completedAt: null,
    accumulatedSeconds: 0,
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
      body: JSON.stringify(
        response({
          ...session,
          status: "IN_PROGRESS",
          startedAt: new Date().toISOString(),
          lastResumedAt: new Date().toISOString(),
        }),
      ),
    });
  });
  await page.route("**/api/v1/sessions/*/pause", (route) => {
    paused = true;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        response({
          ...session,
          status: "PAUSED",
          accumulatedSeconds: 5,
          pausedAt: new Date().toISOString(),
        }),
      ),
    });
  });
  await page.route("**/api/v1/sessions/*/complete", async (route) => {
    completionPayload = route.request().postDataJSON() as Record<
      string,
      unknown
    >;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response({ ...session, status: "COMPLETED" })),
    });
  });

  await page.goto("/app/today");
  await page.getByRole("button", { name: /Bắt đầu/ }).click();

  await expect.poll(() => started).toBe(true);
  await expect(page.getByText("Đã bắt đầu phiên học")).toBeVisible();
  await expect(page.getByText("Focus", { exact: true })).toBeVisible();
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(
    page.getByText("Giữ sự chú ý cho bước nhỏ đang ở trước mắt."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Nghỉ một nhịp" }).click();
  await expect.poll(() => paused).toBe(true);
  await expect(
    page.getByText("Rời mắt khỏi màn hình, thả lỏng vai và hít thở chậm."),
  ).toBeVisible();
  await expect(page.getByRole("timer", { name: /Nghỉ còn/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "5 phút" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.getByRole("button", { name: "Quay lại học" }).click();
  await page.getByRole("button", { name: "Hoàn thành", exact: true }).click();
  await expect(page.getByText("Trước khi kết thúc")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Ghi chú phiên học" })
    .fill("Đã hiểu cách Promise chaining hoạt động.");
  await page.getByRole("button", { name: "Mức tập trung: Rất tốt" }).click();
  await page.getByRole("button", { name: "Hoàn thành và lưu" }).click();

  await expect.poll(() => completionPayload).not.toBeNull();
  expect(completionPayload).toMatchObject({
    notes: "Đã hiểu cách Promise chaining hoạt động.",
    focusLevel: 5,
  });
  await expect(page.getByText("Đã hoàn thành phiên học")).toBeVisible();
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

test("an existing schedule is explicitly rebalanced instead of generated again", async ({
  page,
}) => {
  await mockSession(page);
  let generateCalls = 0;
  let rebalanceCalls = 0;
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
  await page.route("**/api/v1/routines", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response([])),
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
          sessions: [],
          unscheduledTasks: [],
          summary: {
            scheduledTasks: 0,
            scheduledSessions: 0,
            scheduledMinutes: 0,
            unscheduledTasks: 0,
          },
          impact: { action: "REBALANCE", existingSessions: 6 },
        }),
      ),
    }),
  );
  await page.route("**/api/v1/schedules/generate", (route) => {
    generateCalls += 1;
    return route.fulfill({ status: 500, body: "must not be called" });
  });
  await page.route("**/api/v1/schedules/rebalance", (route) => {
    rebalanceCalls += 1;
    return route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify(
        response({
          jobId: "schedule-rebalance-job",
          status: "QUEUED",
          progress: 0,
          message: "Queued",
          error: null,
          result: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      ),
    });
  });
  await page.route("**/api/v1/schedules/jobs/schedule-rebalance-job", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        response({
          jobId: "schedule-rebalance-job",
          status: "COMPLETED",
          progress: 100,
          message: "Completed",
          error: null,
          result: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      ),
    }),
  );

  await page.goto("/app/calendar");
  await page.getByRole("button", { name: /Xếp lịch học/ }).click();
  await page.getByRole("button", { name: /Xem trước/ }).click();

  await expect(page.getByText("Lịch học đã tồn tại")).toBeVisible();
  await expect(
    page.getByText(/6 phiên chưa bắt đầu sẽ được thay thế/),
  ).toBeVisible();
  await page.getByRole("button", { name: /Tái cân bằng lịch/ }).click();

  await expect.poll(() => rebalanceCalls).toBe(1);
  expect(generateCalls).toBe(0);
  await expect(
    page.getByRole("button", { name: /Xem lịch đã tạo/ }),
  ).toBeVisible();
});

test("protected work time contains shorter routine blocks on the timeline", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium");
  await mockSession(page);
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(9, 15, 0, 0);
  const sessionEnd = new Date(monday.getTime() + 40 * 60_000);
  await page.route("**/api/v1/calendar/week**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        response({
          from: "2026-07-27T00:00:00.000+07:00",
          to: "2026-08-03T00:00:00.000+07:00",
          items: [
            {
              kind: "STUDY_SESSION",
              id: "conflicting-session",
              taskId: "work-conflict-task",
              startAt: monday.toISOString(),
              endAt: sessionEnd.toISOString(),
              plannedMinutes: 40,
              actualMinutes: null,
              startedAt: null,
              lastResumedAt: null,
              pausedAt: null,
              completedAt: null,
              accumulatedSeconds: 0,
              status: "SCHEDULED",
              source: "GENERATED",
              task: {
                id: "work-conflict-task",
                title: "Phiên học bị trùng giờ",
                description: null,
                difficulty: "BEGINNER",
                estimatedMinutes: 40,
              },
            },
          ],
        }),
      ),
    }),
  );
  await page.route("**/api/v1/routines", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        response([
          {
            id: "work",
            userId: user.id,
            title: "Work",
            type: "WORK",
            weekdays: ["MONDAY"],
            startTime: "08:30",
            endTime: "17:30",
            source: "USER",
            createdAt: "2026-07-01T00:00:00.000Z",
            updatedAt: "2026-07-01T00:00:00.000Z",
          },
          {
            id: "breakfast",
            userId: user.id,
            title: "Bữa sáng",
            type: "BREAKFAST",
            weekdays: ["MONDAY"],
            startTime: "08:45",
            endTime: "09:00",
            source: "USER",
            createdAt: "2026-07-01T00:00:00.000Z",
            updatedAt: "2026-07-01T00:00:00.000Z",
          },
        ]),
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

  await page.goto("/app/calendar");

  const work = page.getByTestId("timeline-routine-work-start");
  const breakfast = page.getByTestId("timeline-routine-breakfast-start");
  await expect(work).toBeVisible();
  await expect(breakfast).toBeVisible();

  const workBox = await work.boundingBox();
  const breakfastBox = await breakfast.boundingBox();
  expect(workBox).not.toBeNull();
  expect(breakfastBox).not.toBeNull();
  expect(workBox!.height).toBeGreaterThan(breakfastBox!.height * 10);
  expect(breakfastBox!.y).toBeGreaterThan(workBox!.y);
  expect(breakfastBox!.y + breakfastBox!.height).toBeLessThan(
    workBox!.y + workBox!.height,
  );
  await expect
    .poll(async () =>
      breakfast.evaluate((element) =>
        Number(window.getComputedStyle(element).zIndex),
      ),
    )
    .toBeGreaterThan(
      await work.evaluate((element) =>
        Number(window.getComputedStyle(element).zIndex),
      ),
    );

  const conflictingSession = page.getByRole("button", {
    name: "Xem phiên học Phiên học bị trùng giờ",
  });
  await expect(conflictingSession).toBeVisible();
  await conflictingSession.hover();
  await expect(
    page.getByText("Xung đột với Work. Phiên học cần được xếp lại."),
  ).toBeVisible();
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
