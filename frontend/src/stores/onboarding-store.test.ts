import { useOnboardingStore } from "@/stores/onboarding-store";

describe("onboarding draft store", () => {
  beforeEach(() => {
    localStorage.clear();
    useOnboardingStore.getState().reset();
  });

  it("preserves data from earlier steps when a later section changes", () => {
    const store = useOnboardingStore.getState();
    store.updateSection("personal", { fullName: "Minh Trí" });
    store.updateSection("work", { startTime: "09:00" });

    expect(useOnboardingStore.getState().draft.personal.fullName).toBe(
      "Minh Trí",
    );
    expect(useOnboardingStore.getState().draft.work.startTime).toBe("09:00");
    expect(localStorage.getItem("skillpilot-onboarding-draft")).toContain(
      "Minh Trí",
    );
  });
});
