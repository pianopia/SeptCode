# Web

Next.js 14 で実装された SeptCode Web クライアントです。

## 起動

```bash
bun run dev:web
```

## 必須環境変数

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN` (必要な場合)
- `AUTH_SECRET`
- `GCS_BUCKET_NAME` (プロフィール画像保存先の Cloud Storage バケット)
- `NEXT_PUBLIC_SITE_URL` (例: `https://septcode.example.com`)
- `PORT` (Cloud Run では自動注入)

`web/.env.example` をコピーして `web/.env` を作成してください。

本番（`NODE_ENV=production`）では `AUTH_SECRET` が未設定、または開発用プレースホルダ `dev-secret-change-me` の場合、Web は起動時にエラーで終了します。

## Cloud Run デプロイ

`web/deploy.sh` を使う場合、デプロイ前に `export AUTH_SECRET=...` が必要です（未設定の場合はスクリプトが終了します）。

```bash
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/YOUR_GCP_PROJECT/septcode/septcode-web:latest \
  --file web/Dockerfile \
  .

gcloud run deploy septcode-web \
  --image us-central1-docker.pkg.dev/YOUR_GCP_PROJECT/septcode/septcode-web:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars AUTH_SECRET=xxxx,TURSO_DATABASE_URL=xxxx,GCS_BUCKET_NAME=xxxx \
  --set-secrets TURSO_AUTH_TOKEN=YOUR_TURSO_TOKEN_SECRET:latest
```

ヘルスチェックエンドポイント:

- `GET /api/health`
