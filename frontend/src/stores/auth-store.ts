import { create } from "zustand";

import { setAccessToken } from "@/lib/api/auth-session";
import type { CurrentUser } from "@/types/api";

type AuthState = {
  user: CurrentUser | null;
  hydrated: boolean;
  setSession: (user: CurrentUser, accessToken: string) => void;
  setUser: (user: CurrentUser | null) => void;
  clearSession: () => void;
  markHydrated: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setSession: (user, token) => {
    setAccessToken(token);
    set({ user, hydrated: true });
  },
  setUser: (user) => set({ user }),
  clearSession: () => {
    setAccessToken(null);
    set({ user: null, hydrated: true });
  },
  markHydrated: () => set({ hydrated: true }),
}));
