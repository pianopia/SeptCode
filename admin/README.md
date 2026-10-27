# Admin

SeptCode の運用管理画面（Next.js 14）です。

## 起動

```bash
bun run dev:admin
```

## 必須環境変数

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN` (必要な場合)
- `AUTH_SECRET`（本番では未設定・開発用デフォルト値のとき起動時にエラーで停止）
- `ADMIN_LOGIN_ID`
- `ADMIN_LOGIN_PASSWORD`
- `OPENAI_API_KEY` (任意: 未設定時はフォールバックスニペットを投稿)
- `OFFICIAL_POST_NAME`
- `OFFICIAL_POST_HANDLE`
- `OFFICIAL_POST_EMAIL`
- `OFFICIAL_POST_CRON_SECRET`
- `OFFICIAL_POST_INTERVAL_MINUTES`
- `WEB_APP_URL` (任意: 公式投稿プレビュー埋め込み先。既定 `http://localhost:3000`)

`admin/.env.example` をコピーして `admin/.env` を作成してください。例の値はプレースホルダーです。本番では `replace-with-strong-random-secret` などをそのまま使わず、十分長いランダム文字列に置き換えてください。

## Cloud Run デプロイ

```bash
gcloud builds submit \
  --tag asia-east1-docker.pkg.dev/YOUR_GCP_PROJECT/septcode/septcode-admin:latest \
  --file admin/Dockerfile \
  .

gcloud run deploy septcode-admin \
  --image asia-east1-docker.pkg.dev/YOUR_GCP_PROJECT/septcode/septcode-admin:latest \
  --region asia-east1 \
  --no-allow-unauthenticated \
  --set-env-vars AUTH_SECRET=xxxx,TURSO_DATABASE_URL=xxxx,ADMIN_LOGIN_ID=xxxx,ADMIN_LOGIN_PASSWORD=xxxx,OFFICIAL_POST_CRON_SECRET=xxxx,WEB_APP_URL=https://your-web-domain.com \
  --set-secrets TURSO_AUTH_TOKEN=YOUR_TURSO_TOKEN_SECRET:latest
```

`AUTH_SECRET` を Cloud Run に設定しない、または開発用フォールバックと同じ値にした場合、コンテナは起動時に失敗します（api/web と同様の fail-closed）。

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
