"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CURRENT_USER_COOKIE } from "@/lib/auth";

export async function selectUser(userId: string) {
  if (!userId) return;

  const cookieStore = await cookies();
  cookieStore.set(CURRENT_USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  redirect("/");
}

export async function createUser(formData: FormData) {
  const name = formData.get("name");
  const experienceLevel = formData.get("experienceLevel");
  if (typeof name !== "string" || !name.trim()) return;
  if (
    typeof experienceLevel !== "string" ||
    !["inexperienced", "beginner", "experienced"].includes(experienceLevel)
  ) {
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      experienceLevel: experienceLevel as
        | "inexperienced"
        | "beginner"
        | "experienced",
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(CURRENT_USER_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(CURRENT_USER_COOKIE);
  redirect("/login");
}
