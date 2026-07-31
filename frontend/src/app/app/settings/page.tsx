"use client";

import { useMutation } from "@tanstack/react-query";
import { Bell, Check, Laptop, Moon, Save, Sun, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiError } from "@/lib/api/errors";
import { usersApi, type UpdateUserInput } from "@/lib/api/users.api";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import type { CurrentUser } from "@/types/api";

type ThemeChoice = "light" | "dark" | "system";

const themes: Array<{
  value: ThemeChoice;
  label: string;
  description: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Sáng", description: "Rõ ràng và ấm áp", icon: Sun },
  {
    value: "dark",
    label: "Tối",
    description: "Dịu mắt khi học muộn",
    icon: Moon,
  },
  {
    value: "system",
    label: "Theo thiết bị",
    description: "Tự động đồng bộ",
    icon: Laptop,
  },
];

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Skeleton className="h-[42rem]" />;

  return <SettingsContent user={user} />;
}

function SettingsContent({ user }: { user: CurrentUser }) {
  const setUser = useAuthStore((state) => state.setUser);
  const storedTheme = useUiStore((state) => state.theme);
  const storeTheme = useUiStore((state) => state.setTheme);
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState({
    fullName: user.profile?.fullName ?? "",
    occupation: user.profile?.occupation ?? "",
    jobTitle: user.profile?.jobTitle ?? "",
    timezone: user.profile?.timezone ?? "Asia/Ho_Chi_Minh",
    locale: user.profile?.locale ?? "vi-VN",
  });
  const [preferences, setPreferences] = useState({
    preferredSessionMinutes: user.preference?.preferredSessionMinutes ?? 45,
    maxDailyLearningMinutes: user.preference?.maxDailyLearningMinutes ?? 120,
    maxCognitiveLoad: user.preference?.maxCognitiveLoad ?? 7,
    preferredLearningStyle: user.preference?.preferredLearningStyle ?? "MIXED",
    preferredLearningFormat:
      user.preference?.preferredLearningFormat ?? "MIXED",
    progressSummary: user.preference?.notifications.progressSummary ?? true,
    scheduleChanges: user.preference?.notifications.scheduleChanges ?? true,
    deadlineRisk: user.preference?.notifications.deadlineRisk ?? true,
  });

  const save = useMutation({
    mutationFn: (input: UpdateUserInput) => usersApi.updateMe(input),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Cài đặt đã được lưu");
    },
    onError: (error) =>
      toast.error(isApiError(error) ? error.message : "Không thể lưu cài đặt."),
  });
  const chooseTheme = (next: ThemeChoice) => {
    setTheme(next);
    storeTheme(next);
    toast.success("Giao diện đã được cập nhật");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <p className="text-primary-strong text-sm font-semibold">Cài đặt</p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          SkillPilot theo cách của bạn.
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
          Điều chỉnh giao diện, thông tin cá nhân và giới hạn học tập. Scheduler
          sẽ dùng các giới hạn này ở lần lập lịch tiếp theo.
        </p>
      </div>

      <section className="mt-8" aria-labelledby="appearance-title">
        <div className="flex items-center gap-3">
          <span className="bg-primary-soft text-primary-strong grid size-11 place-items-center rounded-2xl">
            <Sun className="size-5" />
          </span>
          <div>
            <h2
              id="appearance-title"
              className="font-display text-2xl font-bold"
            >
              Giao diện
            </h2>
            <p className="text-muted-foreground text-xs">
              Có hiệu lực ngay trên toàn ứng dụng.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {themes.map(({ value, label, description, icon: Icon }) => {
            const selected = (theme ?? storedTheme) === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseTheme(value)}
                className={cn(
                  "border-border bg-surface focus-visible:ring-ring/35 relative flex min-h-28 items-center gap-4 rounded-[24px] border p-5 text-left transition-[border-color,transform,background-color] outline-none hover:-translate-y-0.5 focus-visible:ring-3",
                  selected && "border-primary bg-primary-soft",
                )}
              >
                <span className="bg-surface grid size-11 place-items-center rounded-2xl shadow-sm">
                  <Icon className="size-5" />
                </span>
                <span>
                  <strong className="block text-sm">{label}</strong>
                  <span className="text-muted-foreground mt-1 block text-xs">
                    {description}
                  </span>
                </span>
                {selected ? (
                  <Check className="text-primary-strong absolute top-4 right-4 size-4" />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <form
        className="mt-8 space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate({
            ...profile,
            preferredSessionMinutes: preferences.preferredSessionMinutes,
            maxDailyLearningMinutes: preferences.maxDailyLearningMinutes,
            maxCognitiveLoad: preferences.maxCognitiveLoad,
            preferredLearningStyle: preferences.preferredLearningStyle,
            preferredLearningFormat: preferences.preferredLearningFormat,
            notifications: {
              progressSummary: preferences.progressSummary,
              scheduleChanges: preferences.scheduleChanges,
              deadlineRisk: preferences.deadlineRisk,
            },
          });
        }}
      >
        <Card>
          <div className="flex items-center gap-3">
            <span className="bg-info-soft text-info grid size-11 place-items-center rounded-2xl">
              <UserRound className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold">Hồ sơ</h2>
              <p className="text-muted-foreground text-xs">
                Dùng để cá nhân hóa lời chào và múi giờ.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Input
              label="Tên hiển thị"
              value={profile.fullName}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  fullName: event.target.value,
                }))
              }
              required
              minLength={2}
            />
            <Input
              label="Email"
              value={user?.email ?? ""}
              disabled
              description="Email đăng nhập chưa thể đổi trong phiên bản này."
            />
            <Input
              label="Nghề nghiệp"
              value={profile.occupation}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  occupation: event.target.value,
                }))
              }
            />
            <Input
              label="Vị trí công việc"
              value={profile.jobTitle}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  jobTitle: event.target.value,
                }))
              }
            />
            <SelectField
              label="Múi giờ"
              value={profile.timezone}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  timezone: event.target.value,
                }))
              }
              options={[
                { value: "Asia/Ho_Chi_Minh", label: "Việt Nam (GMT+7)" },
                { value: "Asia/Bangkok", label: "Bangkok (GMT+7)" },
                { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
                { value: "UTC", label: "UTC" },
              ]}
            />
            <SelectField
              label="Ngôn ngữ"
              value={profile.locale}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  locale: event.target.value,
                }))
              }
              options={[
                { value: "vi-VN", label: "Tiếng Việt" },
                { value: "en-US", label: "English" },
              ]}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="bg-accent-soft text-warning grid size-11 place-items-center rounded-2xl">
              <Save className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold">
                Cách học phù hợp
              </h2>
              <p className="text-muted-foreground text-xs">
                Các giới hạn giúp kế hoạch bền vững hơn.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              type="number"
              min={15}
              max={240}
              label="Thời lượng mỗi phiên (phút)"
              value={preferences.preferredSessionMinutes}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  preferredSessionMinutes: Number(event.target.value),
                }))
              }
            />
            <Input
              type="number"
              min={15}
              max={480}
              label="Tối đa mỗi ngày (phút)"
              value={preferences.maxDailyLearningMinutes}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  maxDailyLearningMinutes: Number(event.target.value),
                }))
              }
            />
            <Input
              type="number"
              min={1}
              max={10}
              label="Tải nhận thức tối đa (1–10)"
              value={preferences.maxCognitiveLoad}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  maxCognitiveLoad: Number(event.target.value),
                }))
              }
            />
            <SelectField
              label="Phong cách học"
              value={preferences.preferredLearningStyle}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  preferredLearningStyle: event.target.value,
                }))
              }
              options={[
                { value: "VISUAL", label: "Hình ảnh" },
                { value: "AUDITORY", label: "Nghe" },
                { value: "READING_WRITING", label: "Đọc và viết" },
                { value: "KINESTHETIC", label: "Thực hành" },
                { value: "MIXED", label: "Kết hợp" },
              ]}
            />
            <SelectField
              label="Định dạng nội dung"
              value={preferences.preferredLearningFormat}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  preferredLearningFormat: event.target.value,
                }))
              }
              options={[
                { value: "VIDEO", label: "Video" },
                { value: "TEXT", label: "Bài viết / sách" },
                { value: "INTERACTIVE", label: "Tương tác" },
                { value: "PROJECT", label: "Dự án" },
                { value: "MENTOR", label: "Mentor" },
                { value: "MIXED", label: "Kết hợp" },
              ]}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="bg-coral-soft text-coral grid size-11 place-items-center rounded-2xl">
              <Bell className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold">Thông báo</h2>
              <p className="text-muted-foreground text-xs">
                Chọn những thay đổi thực sự cần bạn chú ý.
              </p>
            </div>
          </div>
          <div className="mt-5 divide-y">
            <NotificationSwitch
              label="Tóm tắt tiến độ"
              description="Nhận bản tổng kết nhịp học định kỳ."
              checked={preferences.progressSummary}
              onChange={(checked) =>
                setPreferences((current) => ({
                  ...current,
                  progressSummary: checked,
                }))
              }
            />
            <NotificationSwitch
              label="Thay đổi lịch"
              description="Báo khi phiên học được tự động chuyển giờ."
              checked={preferences.scheduleChanges}
              onChange={(checked) =>
                setPreferences((current) => ({
                  ...current,
                  scheduleChanges: checked,
                }))
              }
            />
            <NotificationSwitch
              label="Nguy cơ trễ deadline"
              description="Chỉ báo khi ước tính hoàn thành vượt mục tiêu đáng kể."
              checked={preferences.deadlineRisk}
              onChange={(checked) =>
                setPreferences((current) => ({
                  ...current,
                  deadlineRisk: checked,
                }))
              }
            />
          </div>
        </Card>

        <div className="sticky bottom-20 z-20 flex justify-end lg:bottom-4">
          <Button
            type="submit"
            size="lg"
            loading={save.isPending}
            loadingLabel="Đang lưu…"
            className="shadow-xl"
          >
            <Save className="size-4" /> Lưu cài đặt
          </Button>
        </div>
      </form>
    </div>
  );
}

function NotificationSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 py-4 first:pt-0 last:pb-0">
      <span>
        <strong className="block text-sm">{label}</strong>
        <span className="text-muted-foreground mt-1 block text-xs leading-5">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        className="bg-muted peer-focus-visible:ring-ring/35 peer-checked:bg-primary relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-3 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5"
        aria-hidden="true"
      />
    </label>
  );
}
