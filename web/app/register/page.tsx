import Link from "next/link";
import { registerAction } from "@/app/actions";

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  const errMap: Record<string, string> = {
    email_taken: "このメールアドレスは登録済みです。",
    handle_taken: "このハンドルは使われています。",
    invalid_input: "入力値を確認してください。"
  };
  const error = searchParams.error ? errMap[searchParams.error] ?? "登録に失敗しました。" : "";

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-700 bg-panel/80 p-6">
      <h1 className="mb-4 text-2xl font-bold">新規登録</h1>
      {error && <p className="mb-3 text-sm text-rose-300">{error}</p>}
      <form action={registerAction} className="space-y-3">
        <input name="name" placeholder="表示名" required className="w-full" />
        <input name="handle" placeholder="handle (英数字と_)" required className="w-full" />
        <input name="email" type="email" placeholder="Email" required className="w-full" />
        <input name="password" type="password" placeholder="Password" required className="w-full" />
        <button type="submit" className="w-full rounded-lg bg-accent px-4 py-2 font-semibold text-slate-950">
          アカウント作成
        </button>
      </form>
      <p className="mt-3 text-sm text-slate-300">
        登録済みの場合は <Link href="/login" className="text-accent2">ログイン</Link>
      </p>
    </div>
  );
}
