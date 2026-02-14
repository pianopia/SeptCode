import { getUsersForAdmin } from "@/lib/queries";

export default async function UsersPage() {
  const users = await getUsersForAdmin();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-ink">ユーザー一覧</h1>
        <p className="mt-1 text-sm text-subInk">登録ユーザーの基本情報と利用状況を確認できます。</p>
        <p className="mt-2 text-sm font-semibold text-ink">ユーザー総数: {users.length}</p>
      </section>

      <section className="overflow-x-auto rounded-xl border border-line bg-panel">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.08em] text-subInk">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Handle</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Posts</th>
              <th className="px-4 py-3">Followers</th>
              <th className="px-4 py-3">Following</th>
              <th className="px-4 py-3">Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-line text-ink">
                <td className="px-4 py-3">{user.id}</td>
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-subInk">@{user.handle}</td>
                <td className="px-4 py-3 text-subInk">{user.email}</td>
                <td className="px-4 py-3">{user.postCount}</td>
                <td className="px-4 py-3">{user.followerCount}</td>
                <td className="px-4 py-3">{user.followingCount}</td>
                <td className="px-4 py-3 text-subInk">{user.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
