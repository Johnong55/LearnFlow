"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { notificationsApi } from "@/lib/api/notifications.api";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils/cn";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const notifications = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: ({ signal }) => notificationsApi.list(signal),
    staleTime: 60_000,
  });
  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
    onError: () => toast.error("Không thể đánh dấu thông báo."),
  });
  const unread =
    notifications.data?.filter((item) => item.status !== "READ").length ?? 0;

  return (
    <div className="relative">
      <Button
        size="icon"
        variant="ghost"
        aria-label={unread ? `${unread} thông báo chưa đọc` : "Thông báo"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {unread ? <BellRing className="size-5" /> : <Bell className="size-5" />}
        {unread ? (
          <span className="bg-coral absolute top-1.5 right-1.5 min-w-4 rounded-full px-1 text-center text-[9px] font-bold text-white">
            {Math.min(unread, 9)}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div className="border-border bg-surface absolute top-13 right-0 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[22px] border shadow-2xl">
          <div className="border-border flex items-center justify-between border-b p-4">
            <div>
              <h2 className="font-display text-lg font-bold">Thông báo</h2>
              <p className="text-muted-foreground text-[11px]">
                Những thay đổi cần bạn biết
              </p>
            </div>
            <span className="bg-primary-soft text-primary-strong rounded-full px-2 py-1 text-[10px] font-bold">
              {unread} mới
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {notifications.isPending ? (
              <p className="text-muted-foreground p-5 text-center text-sm">
                Đang tải thông báo…
              </p>
            ) : notifications.isError ? (
              <div className="p-4 text-center">
                <p className="text-danger text-sm">Không thể tải thông báo.</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => void notifications.refetch()}
                >
                  Thử lại
                </Button>
              </div>
            ) : notifications.data?.length ? (
              notifications.data.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.status === "READ" || markRead.isPending}
                  onClick={() => markRead.mutate(item.id)}
                  className={cn(
                    "hover:bg-surface-muted focus-visible:ring-ring/35 relative w-full rounded-2xl p-3 text-left outline-none focus-visible:ring-3 disabled:cursor-default",
                    item.status !== "READ" && "bg-primary-soft/55",
                  )}
                >
                  <div className="flex gap-3">
                    <span
                      className={cn(
                        "mt-1 size-2 shrink-0 rounded-full",
                        item.status === "READ" ? "bg-border" : "bg-primary",
                      )}
                    />
                    <span className="min-w-0">
                      <strong className="block text-sm">{item.title}</strong>
                      <span className="text-muted-foreground mt-1 block text-xs leading-5">
                        {item.message}
                      </span>
                      <span className="text-muted-foreground mt-2 block text-[10px]">
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-7 text-center">
                <CheckCheck className="text-success mx-auto size-8" />
                <p className="mt-3 text-sm font-semibold">
                  Mọi thứ đã được cập nhật
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Chưa có thông báo mới.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
