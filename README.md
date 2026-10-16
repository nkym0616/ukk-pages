# UKK — Cloudflare Pages + Supabase

このリポジトリは、UKKの公開画面と、その**編集用の元コード**をまとめたものです。リポジトリは非公開のまま維持し、Cloudflare Pagesが `main` ブランチの更新を自動でビルドして公開します。

画面はCloudflare Pages、Googleログイン・役職・コンテスト・タスクはSupabase AuthとPostgresで運用します。ブラウザに配布するSupabaseの公開可能キーはRLSで保護され、Googleのクライアントシークレットやサービスロールキーはこのリポジトリに保存しません。

> 部員の登録情報やタスクの実データはGitHubへ保存されません。Supabaseに保存され、メールアドレスはアドミンだけが取得できるようにしています。

## Cloudflare Pages の設定

Cloudflare Dashboardで **Workers & Pages** → **Create application** → **Pages** → **Connect to Git** を選び、`nkym0616/ukk-pages` を接続します。GitHub Appのアクセス範囲は、`ukk-pages` だけに限定します。

| 設定項目               | 値                                                   |
| ---------------------- | ---------------------------------------------------- |
| Production branch      | `main`                                               |
| Framework preset       | `None`                                               |
| Build command          | `pnpm install --frozen-lockfile && pnpm build:pages` |
| Build output directory | `dist-pages`                                         |
| Root directory         | 空欄                                                 |

Cloudflare Pagesは、`main` にマージされた変更を本番公開します。別ブランチの変更はプレビューとして確認できます。

## Supabase Auth の公開URL設定

Cloudflare Pagesの初回デプロイ後に表示される実際の `https://<project>.pages.dev/` を、Supabase Dashboardの **Authentication** → **URL Configuration** で次の両方へ登録します。

- **Site URL**
- **Redirect URLs**

UKKでは、開いているサイトのURLへGoogleログイン後に戻るため、この登録が必須です。Google Cloud側のOAuthコールバックURIは、既存のSupabase callback URLのままにします。

## どこを編集するか

| 変えたいこと                           | GitHub上の場所                                                             |
| -------------------------------------- | -------------------------------------------------------------------------- |
| 画面の文章、ボタン、表示の順番         | [`client/src/pages/Home.tsx`](client/src/pages/Home.tsx)                   |
| 色、余白、文字サイズ、スマホ表示       | [`client/src/index.css`](client/src/index.css)                             |
| タスク・コンテスト・メンバーの入力画面 | [`client/src/components/UkkForms.tsx`](client/src/components/UkkForms.tsx) |
| タブ名、説明文、アイコン               | [`client/index.html`](client/index.html)                                   |

ファイルを開いて右上の鉛筆アイコンから編集し、**Commit changes** を押してください。Cloudflare Pagesが自動で本番版を更新します。

## ローカルでの確認

```bash
pnpm install --frozen-lockfile
pnpm build:pages
```

成果物は `dist-pages/` に生成されます。
