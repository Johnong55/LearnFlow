"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";

export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputProps, "type" | "trailing">
>((props, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      ref={ref}
      type={visible ? "text" : "password"}
      trailing={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 min-h-9 rounded-xl"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </Button>
      }
    />
  );
});

PasswordInput.displayName = "PasswordInput";
