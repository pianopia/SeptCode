# Native App

Expo + React Native 版の SeptCode クライアントです。

## 起動

```bash
bun run dev:native
```

API 接続先は環境変数 `EXPO_PUBLIC_API_URL` で指定します。

例:

```bash
EXPO_PUBLIC_API_URL=http://localhost:8787 bun run dev:native
```

`.env.example` をコピーして `native-app/.env` を作成してください。

## App Store リリース (Expo EAS)

`native-app/eas.json` を使用してビルドします。

### 1) TestFlight に配信（本番前）

```bash
cd native-app
bun run release:testflight
```

### 2) 本番リリース

```bash
cd native-app
bun run release:ios
```

事前に以下を更新してください:

- `native-app/.env` を作成して値を設定（`.env.example` 参照）
- `app.json` の `ios.bundleIdentifier` / `android.package`
- `.env` の `EXPO_PUBLIC_API_URL` を本番 API URL に設定
- `.env` の `ASC_APP_ID` を App Store Connect の App ID に設定
- `.env` の `EXPO_TOKEN` を Expo Personal Access Token に設定（非対話実行時）

`EXPO_TOKEN` は Expo ダッシュボードで発行します:

1. Expo にログイン
2. Account Settings → Access Tokens
3. `Create token` で Personal Access Token を作成
4. ローカル/CIで `EXPO_TOKEN` 環境変数に設定

事前チェック:

```bash
cd native-app
bun run release:check-env
```

手動で分けて実行する場合:

```bash
cd native-app
bun run eas:build:ios

bun run eas:submit:ios
```

## 実装済み機能

- ログイン/新規登録
- タイムライン（おすすめ・フォロー中）
- 投稿作成（7行コード + 2行前提）
- いいね
- 投稿詳細とコメント
- プロフィール表示とフォロー
