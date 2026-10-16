# Cloudflare Pages 移行

- [ ] `ukk-pages` をGitHubの非公開リポジトリのままCloudflare Pagesへ接続し、`main` へのマージで本番URLを自動更新する。
- [x] Viteの公開ベースパスをCloudflare Pages / Vercelに対応する `/` へ変更し、`pnpm build:pages` が `dist-pages` を出力することを確認する。
- [ ] GitHub Pages専用のビルドワークフローを外し、Cloudflare Pagesの公開URLをSupabase AuthのSite URLとRedirect URLsへ安全に登録してGoogleログインを確認する。
