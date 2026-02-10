# Septima Monorepo

Bun workspaces を使った構成です。

- `web/`: 既存のWebアプリ (Next.js)
- `api/`: 共通APIワークスペース
- `admin/`: 管理画面ワークスペース
- `native-app/`: ネイティブアプリワークスペース
- `packages/db/`: 共通DB定義(Drizzle schema)

## セットアップ

```bash
bun install
bun run dev:web
```

## DB操作 (web)

```bash
bun run db:generate
bun run db:push
bun run db:seed
```
