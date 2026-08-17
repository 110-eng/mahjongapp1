import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, isValidEmail, isValidPassword } from "../password";

describe("hashPassword / verifyPassword", () => {
  it("正しいパスワードで検証に成功する", () => {
    const hash = hashPassword("correct-horse-battery");
    expect(verifyPassword("correct-horse-battery", hash)).toBe(true);
  });

  it("誤ったパスワードでは検証に失敗する", () => {
    const hash = hashPassword("correct-horse-battery");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("同じパスワードでも呼び出しごとに異なるハッシュ(salt)が生成される", () => {
    const hash1 = hashPassword("correct-horse-battery");
    const hash2 = hashPassword("correct-horse-battery");
    expect(hash1).not.toBe(hash2);
    expect(verifyPassword("correct-horse-battery", hash1)).toBe(true);
    expect(verifyPassword("correct-horse-battery", hash2)).toBe(true);
  });

  it("不正な形式のハッシュ文字列に対してはfalseを返す", () => {
    expect(verifyPassword("correct-horse-battery", "invalid-hash")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("一般的な形式のメールアドレスを許可する", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("@やドメイン部がない場合は拒否する", () => {
    expect(isValidEmail("user")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("user@example")).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("8文字以上を許可する", () => {
    expect(isValidPassword("12345678")).toBe(true);
  });

  it("8文字未満は拒否する", () => {
    expect(isValidPassword("1234567")).toBe(false);
  });
});
