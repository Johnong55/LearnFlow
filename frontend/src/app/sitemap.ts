import type { MetadataRoute } from "next";

import { SITE_URL } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/sign-in`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/sign-up`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
