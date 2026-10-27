# Admin

SeptCode の運用管理画面（Next.js 14）です。

## 起動

```bash
bun run dev:admin
```

## 必須環境変数

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN` (必要な場合)
- `AUTH_SECRET`
- `ADMIN_LOGIN_ID`
- `ADMIN_LOGIN_PASSWORD`
- `OPENAI_API_KEY` (任意: 未設定時はフォールバックスニペットを投稿)
- `OFFICIAL_POST_NAME`
- `OFFICIAL_POST_HANDLE`
- `OFFICIAL_POST_EMAIL`
- `OFFICIAL_POST_CRON_SECRET`
- `OFFICIAL_POST_INTERVAL_MINUTES`
- `WEB_APP_URL` (任意: 公式投稿プレビュー埋め込み先。既定 `http://localhost:3000`)

`admin/.env.example` をコピーして `admin/.env` を作成してください。

本番（`NODE_ENV=production`）では `AUTH_SECRET` が未設定、または開発用プレースホルダ `dev-secret-change-me` の場合、アプリは起動時にエラーで終了します。

## Cloud Run デプロイ

`admin/deploy.sh` はビルド・push・デプロイを行います。実行前にシェル環境へ強いランダム値を設定してください（スクリプトは秘密値を生成しません）。

```bash
export AUTH_SECRET="$(openssl rand -base64 32)"
./deploy.sh
```

その他の本番用環境変数（Turso、管理者ログイン、cron など）は Cloud Run のコンソールまたは `gcloud run services update` で別途設定してください。README の `gcloud run deploy` 例でも `AUTH_SECRET` を `--set-env-vars` に含めてください。

## 実装済み機能

- `.env` 指定のID/パスワードによる管理者ログイン
- サイドバー付きダッシュボード
- マスターデータ（language/library/version/topic）編集
- ユーザー一覧（投稿数・フォロー数付き）
- 運営公式アカウントからのAI投稿（手動実行）
- cron 連携による定期自動投稿（`/api/cron/official-post`）

## 定期実行 (cron) の呼び出し例

`OFFICIAL_POST_CRON_SECRET` を設定したうえで、以下のように定期実行してください。

```bash
curl -X POST \
  -H "Authorization: Bearer ${OFFICIAL_POST_CRON_SECRET}" \
  https://<admin-domain>/api/cron/official-post
```

- 実行間隔は `OFFICIAL_POST_INTERVAL_MINUTES`（既定: 180分）
- 間隔内の呼び出しは `skipped` で返り、重複投稿を防ぎます
