"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CURRENT_USER_COOKIE, PENDING_INVITE_COOKIE } from "@/lib/auth";

const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
};

/** ログイン後の遷移先を決める。招待リンク経由なら招待ページへ、それ以外はGroup一覧へ。 */
async function resolveDestination(): Promise<string> {
  const cookieStore = await cookies();
  const pendingInvite = cookieStore.get(PENDING_INVITE_COOKIE)?.value;
  if (pendingInvite) {
    cookieStore.delete(PENDING_INVITE_COOKIE);
    return `/invite/${pendingInvite}`;
  }
  return "/groups";
}

export async function selectUser(userId: string) {
  if (!userId) return;

  const cookieStore = await cookies();
  cookieStore.set(CURRENT_USER_COOKIE, userId, SESSION_COOKIE_OPTS);
  redirect(await resolveDestination());
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
  cookieStore.set(CURRENT_USER_COOKIE, user.id, SESSION_COOKIE_OPTS);
  redirect(await resolveDestination());
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(CURRENT_USER_COOKIE);
  redirect("/login");
}
