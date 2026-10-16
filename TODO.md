# GitHub Pages 公開

- [ ] 公開リポジトリ `ukk-pages` のGitHub PagesをGitHub Actionsで有効化し、`main` の更新で本番版を自動公開する。
- [x] Viteの公開ベースパスを `https://nkym0616.github.io/ukk-pages/` 用の `/ukk-pages/` に設定し、`pnpm build:pages` が `dist-pages` を出力する。
- [ ] Supabase AuthのSite URLとRedirect URLsに `https://nkym0616.github.io/ukk-pages/` を登録し、Googleログインと部員登録を確認する。
- [x] 部員の登録情報はGitHubへ保存せずSupabaseで保護し、メールアドレスをアドミンだけが取得できるようにする。
