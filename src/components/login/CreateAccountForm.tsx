"use client";

import { useActionState } from "react";
import { register, type RegisterFormState } from "@/app/login/actions";
import { Button } from "@/components/ui/Button";

const INITIAL_STATE: RegisterFormState = {};

export function CreateAccountForm() {
  const [state, formAction, isPending] = useActionState(register, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-3">
      <input
        name="name"
        required
        placeholder="お名前"
        className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
      />
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="メールアドレス"
        className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
      />
      <select
        name="experienceLevel"
        defaultValue="beginner"
        className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
      >
        <option value="inexperienced">未経験</option>
        <option value="beginner">初心者</option>
        <option value="experienced">経験者</option>
      </select>
      <input
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="パスワード(8文字以上)"
        className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
      />
      <input
        name="passwordConfirm"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="パスワード(確認)"
        className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" variant="secondary" className="w-full" disabled={isPending}>
        {isPending ? "登録中..." : "登録して始める"}
      </Button>
    </form>
  );
}
