"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/stores/auth-store";

export function AuthSessionListener() {
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    const handleExpired = () => {
      clearSession();
      toast.error("Phiên đăng nhập đã hết hạn", {
        description: "Vui lòng đăng nhập lại để tiếp tục.",
      });
    };
    window.addEventListener("skillpilot:session-expired", handleExpired);
    return () =>
      window.removeEventListener("skillpilot:session-expired", handleExpired);
  }, [clearSession]);

  return null;
}
