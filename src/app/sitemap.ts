// src/app/sitemap.ts

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://" + "tikozap.com";

  return [
    { url: baseUrl + "/" },
    { url: baseUrl + "/about" },
    { url: baseUrl + "/contact" },
    { url: baseUrl + "/features" },
    { url: baseUrl + "/how-it-works" },
    { url: baseUrl + "/pricing" },
    { url: baseUrl + "/use-cases" },
    { url: baseUrl + "/docs" },
    { url: baseUrl + "/docs/privacy" },
    { url: baseUrl + "/docs/terms" },
    { url: baseUrl + "/support" },
  ];
}
