import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { PageTransition } from "@/components/motion/page-transition";
import { AppProviders } from "@/components/providers/app-providers";
import { BRAND } from "@/config/brand";
import { fontClassNames } from "@/config/fonts";
import { metadataTitle, SITE_DESCRIPTION, SITE_URL } from "@/config/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: metadataTitle, template: `%s | ${BRAND.name}` },
  description: SITE_DESCRIPTION,
  applicationName: BRAND.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: metadataTitle,
    description: SITE_DESCRIPTION,
    siteName: BRAND.name,
    images: [
      { url: "/og-placeholder.svg", width: 1200, height: 630, alt: BRAND.name },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: metadataTitle,
    description: SITE_DESCRIPTION,
    images: ["/og-placeholder.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFDF7" },
    { media: "(prefers-color-scheme: dark)", color: "#101713" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${fontClassNames} font-body antialiased`}>
        <AppProviders>
          <PageTransition>{children}</PageTransition>
        </AppProviders>
      </body>
    </html>
  );
}
