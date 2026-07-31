"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CalendarPlus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { InlineAlert } from "@/components/feedback/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import type {
  CalendarEventItem,
  CalendarEventType,
  CreateCalendarEventInput,
} from "@/lib/api/calendar.api";
import { dateTimeLocalValue } from "@/lib/date/calendar";

type EventEditorProps = {
  open: boolean;
  event?: CalendarEventItem | null | undefined;
  initialDate: Date;
  saving: boolean;
  deleting?: boolean | undefined;
  error?: string | null | undefined;
  onOpenChange: (open: boolean) => void;
  onSave: (input: CreateCalendarEventInput) => void;
  onDelete?: (() => void) | undefined;
};

export function EventEditor({
  open,
  event,
  initialDate,
  saving,
  deleting,
  error,
  onOpenChange,
  onSave,
  onDelete,
}: EventEditorProps) {
  const defaultStart = new Date(initialDate);
  defaultStart.setHours(9, 0, 0, 0);
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60_000);
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [type, setType] = useState<CalendarEventType>(
    event?.type ?? "PERSONAL",
  );
  const [startAt, setStartAt] = useState(
    dateTimeLocalValue(event ? new Date(event.startAt) : defaultStart),
  );
  const [endAt, setEndAt] = useState(
    dateTimeLocalValue(event ? new Date(event.endAt) : defaultEnd),
  );
  const [isFixed, setIsFixed] = useState(event?.isFixed ?? true);
  const [validation, setValidation] = useState<string | null>(null);

  const submit = () => {
    if (!title.trim()) return setValidation("Hãy nhập tên sự kiện.");
    if (new Date(startAt) >= new Date(endAt))
      return setValidation("Giờ kết thúc phải sau giờ bắt đầu.");
    setValidation(null);
    onSave({
      title: title.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(location.trim() ? { location: location.trim() } : {}),
      type,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      isFixed,
      isAllDay: false,
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-sm" />
        <Dialog.Content className="border-border bg-background fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-[30px] border p-5 shadow-2xl outline-none sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[min(92vw,40rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-2xl font-bold">
                {event ? "Chỉnh sự kiện" : "Thêm sự kiện"}
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground mt-1 text-sm">
                Sự kiện cố định sẽ chặn các phiên học trùng giờ.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Đóng">
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="space-y-5">
            {validation || error ? (
              <InlineAlert tone="error">{validation ?? error}</InlineAlert>
            ) : null}
            <Input
              label="Tên sự kiện"
              placeholder="Khám nha, họp nhóm…"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Bắt đầu"
                type="datetime-local"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
              />
              <Input
                label="Kết thúc"
                type="datetime-local"
                value={endAt}
                onChange={(event) => setEndAt(event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Loại sự kiện"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as CalendarEventType)
                }
                options={[
                  { value: "PERSONAL", label: "Cá nhân" },
                  { value: "WORK", label: "Công việc" },
                  { value: "APPOINTMENT", label: "Cuộc hẹn" },
                  { value: "MEDICAL", label: "Y tế" },
                  { value: "FAMILY", label: "Gia đình" },
                  { value: "TRAVEL", label: "Di chuyển" },
                  { value: "OTHER", label: "Khác" },
                ]}
              />
              <Input
                label="Địa điểm (không bắt buộc)"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
            <Textarea
              label="Ghi chú"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24"
            />
            <label className="bg-surface-muted flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-4">
              <span>
                <strong className="block text-sm">Thời gian cố định</strong>
                <span className="text-muted-foreground mt-1 block text-xs">
                  Không cho lịch học chồng lên sự kiện này.
                </span>
              </span>
              <input
                type="checkbox"
                checked={isFixed}
                onChange={(event) => setIsFixed(event.target.checked)}
                className="accent-primary size-5"
              />
            </label>
            <div className="flex flex-wrap justify-between gap-3">
              {event && onDelete ? (
                <Button
                  variant="danger"
                  loading={Boolean(deleting)}
                  onClick={onDelete}
                >
                  <Trash2 className="size-4" /> Xóa
                </Button>
              ) : (
                <span />
              )}
              <Button
                loading={saving}
                loadingLabel="Đang lưu…"
                onClick={submit}
              >
                <CalendarPlus className="size-4" /> Lưu sự kiện
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
