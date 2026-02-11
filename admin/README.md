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

`admin/.env.example` をコピーして `admin/.env` を作成してください。

## 実装済み機能

- `.env` 指定のID/パスワードによる管理者ログイン
- サイドバー付きダッシュボード
- マスターデータ（language/library/version/topic）編集
- ユーザー一覧（投稿数・フォロー数付き）
