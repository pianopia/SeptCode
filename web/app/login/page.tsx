import Link from "next/link";
import { loginAction } from "@/app/actions";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const hasError = Boolean(searchParams.error);
  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-700 bg-panel/80 p-6">
      <h1 className="mb-4 text-2xl font-bold">ログイン</h1>
      {hasError && <p className="mb-3 text-sm text-rose-300">認証に失敗しました。</p>}
      <form action={loginAction} className="space-y-3">
        <input type="hidden" name="intent" value="login" />
        <input name="email" type="email" placeholder="Email" required className="w-full" />
        <input name="password" type="password" placeholder="Password" required className="w-full" />
        <button type="submit" className="w-full rounded-lg bg-accent px-4 py-2 font-semibold text-slate-950">
          ログイン
        </button>
      </form>
      <p className="mt-3 text-sm text-slate-300">
        アカウントがない場合は <Link href="/register" className="text-accent2">新規登録</Link>
      </p>
    </div>
  );
}
