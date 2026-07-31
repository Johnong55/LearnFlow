import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemePreference = "light" | "dark" | "system";

type UiState = {
  sidebarCollapsed: boolean;
  theme: ThemePreference;
  toggleSidebar: () => void;
  setTheme: (theme: ThemePreference) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: "system",
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "skillpilot-ui",
      partialize: ({ sidebarCollapsed, theme }) => ({
        sidebarCollapsed,
        theme,
      }),
    },
  ),
);
