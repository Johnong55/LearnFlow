import {
  BookOpenCheck,
  CalendarRange,
  GitBranch,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const generationStages = [
  {
    threshold: 0,
    label: "Đã nhận mục tiêu",
    description: "Giữ mục tiêu và giới hạn cuộc sống làm trung tâm.",
    icon: Sparkles,
  },
  {
    threshold: 15,
    label: "Tìm lộ trình học hữu ích",
    description: "Tìm nguồn phù hợp với kỹ năng và cấp độ của bạn.",
    icon: Search,
  },
  {
    threshold: 40,
    label: "So sánh và lọc nguồn",
    description: "Xếp hạng nội dung, loại chủ đề trùng lặp.",
    icon: ShieldCheck,
  },
  {
    threshold: 65,
    label: "Thiết kế curriculum đầy đủ",
    description: "Phân tích độ phủ, milestone và module cần thiết.",
    icon: GitBranch,
  },
  {
    threshold: 70,
    label: "Phân rã thành phiên học",
    description: "Mở rộng từng module thành task cụ thể 25–120 phút.",
    icon: BookOpenCheck,
  },
  {
    threshold: 90,
    label: "Kiểm tra cấu trúc",
    description: "Kiểm tra độ phủ, tổng thời lượng, task và URL nguồn.",
    icon: ShieldCheck,
  },
  {
    threshold: 100,
    label: "Roadmap đã sẵn sàng",
    description: "Roadmap đã lưu và lịch theo ngày đang được sắp xếp.",
    icon: CalendarRange,
  },
] as const;

export function stageIndexForProgress(progress: number): number {
  return generationStages.reduce(
    (active, stage, index) => (progress >= stage.threshold ? index : active),
    0,
  );
}
