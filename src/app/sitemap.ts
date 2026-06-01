import { MetadataRoute } from "next";
import { sitemapBranchCodes } from "@/lib/sitemapBranchCodes";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://daiso-finder.kr";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl().replace(/\/$/, "");
  const lastModified = new Date();

  return [
    {
      url: base,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...sitemapBranchCodes.map((code) => ({
      url: `${base}/branch/${code}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
