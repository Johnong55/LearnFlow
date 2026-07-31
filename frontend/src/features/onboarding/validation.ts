import { z } from "zod";

import { SKILL_LEVELS } from "@/features/onboarding/types";

export const aboutSchema = z.object({
  fullName: z.string().trim().min(2, "Hãy nhập tên có ít nhất 2 ký tự."),
  occupation: z
    .string()
    .trim()
    .min(2, "Hãy cho SkillPilot biết công việc hiện tại."),
  jobTitle: z.string().trim().max(150, "Chức danh quá dài."),
  timezone: z.string().min(1, "Hãy chọn múi giờ."),
  locale: z.string().min(1),
});

export const workSchema = z
  .object({
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    commuteMinutes: z.coerce.number().int().min(0).max(240),
  })
  .refine((data) => data.startTime !== data.endTime, {
    message: "Giờ bắt đầu và kết thúc phải khác nhau.",
    path: ["endTime"],
  });

export const sleepSchema = z
  .object({
    wakeUpTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    sleepTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  })
  .refine((data) => data.wakeUpTime !== data.sleepTime, {
    message: "Giờ ngủ và thức dậy phải khác nhau.",
    path: ["sleepTime"],
  });

export const goalSchema = z.object({
  title: z.string().trim().min(3, "Tiêu đề cần ít nhất 3 ký tự.").max(200),
  description: z
    .string()
    .trim()
    .min(10, "Hãy mô tả kết quả bạn muốn đạt được.")
    .max(5000),
  targetDate: z.string().min(1, "Hãy chọn ngày mục tiêu."),
  weeklyAvailableHours: z.coerce.number().min(0.5).max(80),
});

export function isValidLevelProgression(
  current: string,
  target: string,
): boolean {
  const currentIndex = SKILL_LEVELS.findIndex(
    (level) => level.value === current,
  );
  const targetIndex = SKILL_LEVELS.findIndex((level) => level.value === target);
  return currentIndex >= 0 && targetIndex > currentIndex;
}
