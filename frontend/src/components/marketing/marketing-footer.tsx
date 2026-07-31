import Link from "next/link";

import { AppLogo } from "@/components/layout/app-logo";
import { BRAND } from "@/config/brand";

const links = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "mailto:hello@skillpilot.app" },
  { label: "Sign in", href: "/sign-in" },
  { label: "Build my roadmap", href: "/sign-up" },
];

export function MarketingFooter() {
  return (
    <footer className="border-border bg-surface border-t">
      <div className="page-shell grid gap-10 py-12 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <AppLogo />
          <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-6">
            {BRAND.tagline}
          </p>
        </div>
        <nav
          aria-label="Điều hướng cuối trang"
          className="flex flex-wrap gap-x-6 gap-y-3"
        >
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/35 min-h-11 py-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-border text-muted-foreground border-t py-5 text-center text-xs">
        © {new Date().getFullYear()} {BRAND.name}. Built for steady, human
        progress.
      </div>
    </footer>
  );
}
