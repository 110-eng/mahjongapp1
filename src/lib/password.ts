import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 32;

/** パスワードをsalt付きでハッシュ化する。戻り値は "salt:hash" の16進数文字列。 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

/** hashPassword()で生成した文字列に対して平文を検証する(タイミング攻撃対策済み)。 */
export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const storedBuffer = Buffer.from(hash, "hex");
  const suppliedBuffer = scryptSync(plain, salt, KEY_LENGTH);
  if (storedBuffer.length !== suppliedBuffer.length) return false;

  return timingSafeEqual(storedBuffer, suppliedBuffer);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}
