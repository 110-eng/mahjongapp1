import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

/**
 * 簡易ユーザー選択方式の認証層。
 *
 * 既存の認証基盤(Microsoft認証等)が導入され次第、この関数の中身だけを
 * 差し替えれば済むように、アプリの他の部分は getCurrentUser() /
 * requireCurrentUser() 経由でのみユーザーを参照する。
 */
const CURRENT_USER_COOKIE = "atsumare_user_id";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(CURRENT_USER_COOKIE)?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CURRENT_USER_COOKIE)?.value ?? null;
}

export { CURRENT_USER_COOKIE };
