# Release Checklist

最終更新: 2026-02-11

## 1. 実装済み (このリポジトリで対応済み)

- [x] API を Cloud Run で起動できるよう `PORT` 対応
- [x] API の `/health` をヘルスチェックとして利用可能
- [x] Web の `/api/health` を追加
- [x] `api/Dockerfile` を追加
- [x] `web/Dockerfile` を追加
- [x] ルート `.dockerignore` を追加
- [x] `web/.env.example` を追加
- [x] `api/.env.example` を Cloud Run 向けに更新
- [x] `AUTH_SECRET` の本番未設定/弱設定を起動時に拒否（api/web）
- [x] `native-app/eas.json` を追加
- [x] `native-app/app.json` に bundle/package 設定を追加
- [x] API/Web/Native の README にリリース手順を追記

## 2. あなた側で値を入れる必要がある項目

- [ ] `AUTH_SECRET` に十分長いランダム文字列を設定
- [ ] API の `CORS_ORIGIN` を Web 本番URLに固定
- [ ] `TURSO_DATABASE_URL` と `TURSO_AUTH_TOKEN` を Secret 管理で設定
- [ ] `ASC_APP_ID` を App Store Connect の App ID で設定
- [ ] `native-app/app.json` の bundle/package を実運用値に確認
- [ ] `native-app/.env` の `EXPO_PUBLIC_API_URL` を API 本番URLに更新

## 3. Cloud Run リリースタスク

- [ ] Artifact Registry リポジトリ作成
- [ ] `api` イメージのビルド・push
- [ ] `web` イメージのビルド・push
- [ ] Web ビルド環境から `fonts.googleapis.com` に到達できることを確認（またはフォントをローカル同梱）
- [ ] `septcode-api` を Cloud Run デプロイ
- [ ] `septcode-web` を Cloud Run デプロイ
- [ ] デプロイ後に `/health` と `/api/health` の疎通確認
- [ ] Cloud Run の最小インスタンス/同時実行数/タイムアウトを設定

## 4. モバイルストア申請タスク

- [ ] Apple Developer / App Store Connect のアプリ登録
- [ ] プライバシーポリシー URL とサポート URL 用意
- [ ] スクリーンショット/説明文/キーワード用意
- [ ] `eas build --platform ios --profile production`
- [ ] `eas submit --platform ios --profile production`
- [ ] TestFlight で E2E 確認後に審査提出

## 5. 監視・運用 (推奨)

- [ ] Cloud Logging のエラーアラート作成
- [ ] 稼働監視 (Uptime Check) を API/Web それぞれに設定
- [ ] 障害時の連絡先と一次対応フローをドキュメント化
- [ ] DB バックアップ/リストア手順を明文化

## 6. 最終 QA

- [ ] Web: 新規登録/ログイン/投稿/いいね/コメント/フォロー
- [ ] Native: 新規登録/ログイン/投稿一覧/投稿詳細/フォロー
- [ ] API: 認証エラー時の挙動と HTTP ステータス確認
- [ ] 負荷時に Cloud Run のスケールが想定通り動くか確認
