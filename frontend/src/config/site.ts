import { BRAND } from "@/config/brand";

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

export const SITE_DESCRIPTION =
  "Create a personalized learning roadmap and schedule that fits around your work, sleep, routines, and real life.";

export const NAVIGATION = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Preview", href: "/#preview" },
] as const;

export const metadataTitle = `${BRAND.name} — AI Learning Roadmaps Built Around Your Life`;
