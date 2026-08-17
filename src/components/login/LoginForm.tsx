"use client";

import { useActionState } from "react";
import { login, type LoginFormState } from "@/app/login/actions";
import { Button } from "@/components/ui/Button";

const INITIAL_STATE: LoginFormState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-3">
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="メールアドレス"
        className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
      />
      <input
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="パスワード"
        className="w-full rounded-lg border border-ink-400/30 bg-washi-100 px-3 py-2 text-sm outline-none focus:border-gold-500"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" variant="secondary" className="w-full" disabled={isPending}>
        {isPending ? "ログイン中..." : "ログイン"}
      </Button>
    </form>
  );
}
