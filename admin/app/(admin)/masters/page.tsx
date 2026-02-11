import { createMasterAction, deleteMasterAction, updateMasterAction } from "@/app/actions";
import { getMasterData } from "@/lib/queries";

const KIND_OPTIONS = [
  { value: "language", label: "Language" },
  { value: "library", label: "Library" },
  { value: "version", label: "Version" },
  { value: "topic", label: "Topic" }
] as const;

export default async function MasterPage({ searchParams }: { searchParams: { error?: string } }) {
  const data = await getMasterData();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-ink">マスターデータ管理</h1>
        <p className="mt-1 text-sm text-subInk">言語・タグ（ライブラリ/バージョン/トピック）を編集できます。</p>
      </section>

      {searchParams.error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          操作に失敗しました。入力内容または重複データを確認してください。
        </p>
      )}

      <section className="rounded-xl border border-line bg-panel p-4">
        <h2 className="text-lg font-semibold text-ink">マスター追加</h2>
        <form action={createMasterAction} className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
          <input name="name" placeholder="例: typescript / react / v5" required />
          <select name="kind" defaultValue="library">
            {KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentHover">
            追加
          </button>
        </form>
      </section>

      <MasterGroup title="Languages" rows={data.languages} />
      <MasterGroup title="Libraries" rows={data.libraries} />
      <MasterGroup title="Versions" rows={data.versions} />
      <MasterGroup title="Topics" rows={data.topics} />
    </div>
  );
}

function MasterGroup({
  title,
  rows
}: {
  title: string;
  rows: Array<{ id: number; name: string; kind: "language" | "library" | "version" | "topic" }>;
}) {
  return (
    <section className="rounded-xl border border-line bg-panel p-4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-subInk">データなし</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-lg border border-slate-100 p-3">
              <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
                <form action={updateMasterAction} className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
                  <input type="hidden" name="id" value={row.id} />
                  <input type="text" name="name" defaultValue={row.name} required />
                  <select name="kind" defaultValue={row.kind}>
                    {KIND_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-subInk hover:bg-slate-50"
                  >
                    更新
                  </button>
                </form>

                <form action={deleteMasterAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <button type="submit" className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                    削除
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
