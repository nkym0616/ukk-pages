# UKK — GitHub Pages + Supabase

このリポジトリには、UKKの画面を作る**元コード**を保存しています。GitHub Pagesで公開するため、リポジトリは公開です。`main` ブランチに変更を保存すると、GitHub Actionsが画面を自動でビルドし、GitHub Pagesへ反映します。

公開URLは **https://nkym0616.github.io/ukk-pages/** です。

> 部員の登録情報・メールアドレス・タスク・Googleログイン情報はGitHubに保存されません。データはSupabaseに保存され、メールアドレスを取得できるのはアドミンだけです。

画面はGitHub Pages、Googleログイン・役職・コンテスト・タスクはSupabase AuthとPostgresで運用します。ブラウザに配布するSupabaseの公開可能キーはRLSで保護されます。Googleのクライアントシークレット、Supabaseサービスロールキー、部員データはこのリポジトリに保存しません。

## GitHub Pages の設定

GitHubの [Pages設定](https://github.com/nkym0616/ukk-pages/settings/pages) で **Build and deployment** の **Source** を **GitHub Actions** に設定してください。`main` へのpushで **Build and deploy UKK Pages** が実行されます。

## Supabase Auth の公開URL設定

Supabase Dashboardの **Authentication** → **URL Configuration** で、次の両方に公開URLを登録します。

```text
Site URL:      https://nkym0616.github.io/ukk-pages/
Redirect URLs: https://nkym0616.github.io/ukk-pages/
```

UKKでは、開いているサイトのURLへGoogleログイン後に戻るため、この登録が必須です。Google Cloud側のOAuthコールバックURIは、既存のSupabase callback URLのままにします。

## どこを編集するか

| 変えたいこと                           | GitHub上の場所                                                             |
| -------------------------------------- | -------------------------------------------------------------------------- |
| 画面の文章、ボタン、表示の順番         | [`client/src/pages/Home.tsx`](client/src/pages/Home.tsx)                   |
| 色、余白、文字サイズ、スマホ表示       | [`client/src/index.css`](client/src/index.css)                             |
| タスク・コンテスト・メンバーの入力画面 | [`client/src/components/UkkForms.tsx`](client/src/components/UkkForms.tsx) |
| タブ名、説明文、アイコン               | [`client/index.html`](client/index.html)                                   |

ファイルを開いて右上の鉛筆アイコンから編集し、**Commit changes** を押してください。GitHub Actionsが成功すると数分で公開版に反映されます。

## ローカルでの確認

```bash
pnpm install --frozen-lockfile
pnpm build:pages
```

成果物は `dist-pages/` に生成されます。
