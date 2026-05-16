// src/lib/admin.ts

import { cookies } from "next/headers";

export async function requireAdmin() {
  const cookieStore = await cookies();

  const email =
    cookieStore.get("tz_user_email")?.value ||
    cookieStore.get("tz_email")?.value ||
    "local-admin@tikozap.test";

  return { email };
}