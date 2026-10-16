# UKK Supabase設定

このフォルダは、GitHub Pages版UKKのデータベース定義です。ブラウザにはSupabaseの公開可能キーだけを配布し、データアクセスはSupabase AuthとRLSで保護します。Googleシークレット、サービスロールキー、初期アドミンコードはこのリポジトリに保存しません。

## Googleログインの設定

Supabase Dashboardで対象プロジェクト `UKK_task` を開き、次を設定します。

1. **Authentication → Providers → Google** でGoogleプロバイダを有効にし、Google Cloudで作成済みのクライアントIDとクライアントシークレットを登録する。
2. Google CloudのOAuthクライアントの **Authorized redirect URIs** には、次を登録したままにする。

   ```text
   https://secyilbxewnlanvvgvyj.supabase.co/auth/v1/callback
   ```

3. **Authentication → URL Configuration** で、次の公開URLを両方に登録する。

   ```text
   Site URL:      https://nkym0616.github.io/ukk-pages/
   Redirect URLs: https://nkym0616.github.io/ukk-pages/
   ```

Googleログイン後に作られた部員は、最初は「承認待ち」になります。最初のアドミンは、別途安全に渡された一度限りの初期設定コードでアドミン登録を行います。

## マイグレーション

- `migrations/202610130001_ukk_core.sql`: 認証プロフィール、部員・役職、コンテスト、担当、タスク、RLS、権限付きRPC。
- `migrations/202610130002_harden_function_access.sql`: 内部ヘルパー関数と設定テーブルをブラウザから閉じる追加保護。
- `migrations/202610140001_restore_rls_predicate_access.sql`: RLSの閲覧判定に必要な読み取り専用関数の実行権限。
- `migrations/202610140002_rename_admin_messages.sql`: サーバー側のアドミン表記を画面と統一する変更。
- `migrations/202610160001_protect_member_email.sql`: 部員メールアドレスをアドミン限定にする保護。

旧ホストのデータを先に削除しないでください。現在のUKKデータはSupabaseで運用します。
