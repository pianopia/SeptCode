# API

Bun + Hono で実装された SeptCode API サーバーです。

## 起動

```bash
bun run dev:api
```

デフォルトは `http://localhost:8787` で起動します。

## 主なエンドポイント

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /timeline`
- `POST /posts`
- `GET /posts/:publicId`
- `POST /posts/:publicId/like`
- `POST /posts/:publicId/comments`
- `GET /users/:handle`
- `POST /users/:handle/follow`

## 必須環境変数

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN` (必要な場合)
- `AUTH_SECRET`
- `PORT` (Cloud Run では自動注入)
- `CORS_ORIGIN` (本番は `*` ではなく Web の本番URLを指定)

`.env.example` をコピーして `api/.env` を作成してください。

本番（`NODE_ENV=production`）では `AUTH_SECRET` が未設定、または開発用プレースホルダ `dev-secret-change-me` の場合、API は起動時にエラーで終了します。

## Cloud Run デプロイ

`api/deploy.sh` を使う場合、デプロイ前に `export AUTH_SECRET=...` が必要です（未設定の場合はスクリプトが終了します）。

```bash
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/YOUR_GCP_PROJECT/septcode/septcode-api:latest \
  --file api/Dockerfile \
  .

gcloud run deploy septcode-api \
  --image us-central1-docker.pkg.dev/YOUR_GCP_PROJECT/septcode/septcode-api:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars AUTH_SECRET=xxxx,CORS_ORIGIN=https://your-web-domain.com,TURSO_DATABASE_URL=xxxx \
  --set-secrets TURSO_AUTH_TOKEN=YOUR_TURSO_TOKEN_SECRET:latest
```

ヘルスチェックエンドポイント:

- `GET /health`
