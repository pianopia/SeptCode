import { redirect } from "next/navigation";
import { adminLoginAction } from "@/app/actions";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const authenticated = await isAdminAuthenticated();
  if (authenticated) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">管理画面ログイン</h1>

        {searchParams.error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">認証に失敗しました。</p>}

        <form action={adminLoginAction} className="mt-5 space-y-3">
          <div>
            <label htmlFor="loginId" className="mb-1 block text-sm font-medium text-subInk">
              ログインID
            </label>
            <input id="loginId" name="loginId" type="text" className="w-full" required />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-subInk">
              パスワード
            </label>
            <input id="password" name="password" type="password" className="w-full" required />
          </div>

          <button type="submit" className="w-full rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accentHover">
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
