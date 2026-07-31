import { stageIndexForProgress } from "@/features/roadmaps/generation-stages";

describe("roadmap generation stages", () => {
  it("maps backend progress to a determinate stage", () => {
    expect(stageIndexForProgress(0)).toBe(0);
    expect(stageIndexForProgress(15)).toBe(1);
    expect(stageIndexForProgress(64)).toBe(2);
    expect(stageIndexForProgress(70)).toBe(4);
    expect(stageIndexForProgress(90)).toBe(5);
    expect(stageIndexForProgress(100)).toBe(6);
  });
});
