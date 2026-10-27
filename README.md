# SeptCode Monorepo

Bun workspaces を使った構成です。

- `web/`: 既存のWebアプリ (Next.js)
- `api/`: 共通APIワークスペース
- `admin/`: 管理画面ワークスペース
- `native-app/`: ネイティブアプリワークスペース
- `packages/db/`: 共通DB定義(Drizzle schema)

## リリース関連ドキュメント

- `RELEASE_CHECKLIST.md`: 事前チェックと残タスク
- `api/README.md`: API の Cloud Run デプロイ手順
- `web/README.md`: Web の Cloud Run デプロイ手順
- `native-app/README.md`: Expo 開発手順

## セットアップ

```bash
bun install
bun run dev:web
bun run dev:api
bun run dev:admin
bun run dev:native
bun run dev:app
```

Native は別ターミナルで:

```bash
EXPO_PUBLIC_API_URL=http://localhost:8787 bun run dev:native
```

API / Web / Admin 起動時は `.env` などに以下を設定してください:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN` (必要な場合)
- `AUTH_SECRET`（本番 `NODE_ENV=production` では必須。未設定や `dev-secret-change-me` の場合は起動しません）
- `CORS_ORIGIN` (本番では `*` を避ける。API のみ)

各ワークスペースの `.env.example` をコピーして `.env` を作成してください。Cloud Run では `deploy.sh` 実行前に `export AUTH_SECRET=...` が必要です（スクリプトは値を生成しません）。

## DB操作 (web)

```bash
bun run db:generate
bun run db:push
bun run db:seed
```
