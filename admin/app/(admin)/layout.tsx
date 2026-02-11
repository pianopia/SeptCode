import Link from "next/link";
import { redirect } from "next/navigation";
import { adminLogoutAction } from "@/app/actions";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/login");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="border-b border-line bg-panel/90 p-5 md:border-b-0 md:border-r">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-subInk">SEPTCODE</p>
          <p className="text-xl font-bold text-ink">Admin Console</p>
        </div>

        <nav className="space-y-2 text-sm font-medium text-ink">
          <Link href="/" className="block rounded-lg px-3 py-2 hover:bg-slate-100">
            ダッシュボード
          </Link>
          <Link href="/masters" className="block rounded-lg px-3 py-2 hover:bg-slate-100">
            マスターデータ管理
          </Link>
          <Link href="/users" className="block rounded-lg px-3 py-2 hover:bg-slate-100">
            ユーザー一覧
          </Link>
        </nav>

        <form action={adminLogoutAction} className="mt-8">
          <button
            type="submit"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-subInk hover:bg-slate-100"
          >
            ログアウト
          </button>
        </form>
      </aside>

      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}
