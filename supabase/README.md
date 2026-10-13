# UKK Supabase設定

このフォルダは、GitHub Pages版UKKをManusから切り離すためのデータベース定義です。ブラウザにはSupabaseの公開可能キーだけを配布し、データアクセスはSupabase AuthとRLSで保護します。Googleシークレット、サービスロールキー、初期アドミンコードはこのリポジトリに保存しません。

## Googleログインの設定

Supabase Dashboardで対象プロジェクト `UKK_task` を開き、次を設定します。

1. **Authentication → Providers → Google** でGoogleプロバイダを有効にし、Google Cloudで作成済みのクライアントIDとクライアントシークレットを登録する。
2. Google CloudのOAuthクライアントに、次を登録する。
   - Authorized JavaScript origins: `https://nkym0616.github.io`
   - Authorized redirect URIs: `https://secyilbxewnlanvvgvyj.supabase.co/auth/v1/callback`
3. **Authentication → URL Configuration** で次を設定する。
   - Site URL: `https://nkym0616.github.io/ukk-pages/`
   - Redirect URLs: `https://nkym0616.github.io/ukk-pages/`

Googleログイン後に作られた部員は、最初は「承認待ち」になります。最初のアドミンは、別途安全に渡された一度限りの初期設定コードでアドミン登録を行います。

## マイグレーション

- `migrations/202610130001_ukk_core.sql`: 認証プロフィール、部員・役職、コンテスト、担当、タスク、RLS、権限付きRPC。
- `migrations/202610130002_harden_function_access.sql`: 内部ヘルパー関数と設定テーブルをブラウザから閉じる追加保護。

既存のManus環境にあるデータは、初期アドミンのSupabaseログイン確認後に移す。旧環境のデータを先に削除しない。
