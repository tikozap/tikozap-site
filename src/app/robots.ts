// src/app/robots.ts

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
disallow: [
  "/admin/",
  "/dashboard/",
  "/onboarding/",
  "/widget/embed",
  "/tz-test",
  "/login",
  "/logout",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/",
],
    },
  };
}