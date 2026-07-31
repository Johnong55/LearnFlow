import { z } from "zod";

const email = z
  .string()
  .trim()
  .email("Hãy nhập một địa chỉ email hợp lệ.")
  .max(320);
const password = z
  .string()
  .min(12, "Mật khẩu cần ít nhất 12 ký tự.")
  .max(128, "Mật khẩu không được dài quá 128 ký tự.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Hãy nhập mật khẩu.").max(128),
});

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Tên cần ít nhất 2 ký tự.")
      .max(150, "Tên không được dài quá 150 ký tự."),
    email,
    password,
    confirmPassword: z.string(),
    acceptTerms: z
      .boolean()
      .refine((value) => value, "Bạn cần đồng ý với điều khoản để tiếp tục."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận chưa khớp.",
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận chưa khớp.",
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
