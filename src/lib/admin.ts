// src/lib/admin.ts

import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

const ADMIN_EMAILS = new Set([
  "admin@tikozap.com",
]);

export async function requireAdmin() {
  const userId = await getUserId();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user?.email) {
    return null;
  }

  const email = user.email.trim().toLowerCase();

  if (!ADMIN_EMAILS.has(email)) {
    return null;
  }

  return {
    id: user.id,
    email,
    name: user.name,
  };
}