import {
  goalSchema,
  isValidLevelProgression,
} from "@/features/onboarding/validation";

describe("onboarding validation", () => {
  it("requires the target skill level to be higher than the current level", () => {
    expect(isValidLevelProgression("NONE", "BEGINNER")).toBe(true);
    expect(isValidLevelProgression("INTERMEDIATE", "INTERMEDIATE")).toBe(false);
    expect(isValidLevelProgression("ADVANCED", "BEGINNER")).toBe(false);
  });

  it("rejects an unclear learning goal", () => {
    const result = goalSchema.safeParse({
      title: "API",
      description: "quá ngắn",
      targetDate: "",
      weeklyAvailableHours: 0,
    });

    expect(result.success).toBe(false);
  });
});
