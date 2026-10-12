# UKK — GitHub Pagesの画面ソース

公開URL: **https://nkym0616.github.io/ukk-pages/**

このリポジトリは、UKKの公開画面と、その**編集用の元コード**をまとめたものです。GitHub上で画面の元コードを編集して `main` ブランチへ保存すると、GitHub Actionsが自動で画面を作り直し、GitHub Pagesへ反映します。通常は数分で更新されます。

## どこを編集するか

| 変えたいこと | GitHub上の場所 |
|---|---|
| 画面の文章、ボタン、表示の順番 | [`client/src/pages/Home.tsx`](client/src/pages/Home.tsx) |
| 色、余白、文字サイズ、スマホ表示 | [`client/src/index.css`](client/src/index.css) |
| タスク・コンテスト・メンバーの入力画面 | [`client/src/components/UkkForms.tsx`](client/src/components/UkkForms.tsx) |
| タブ名、説明文、アイコン | [`client/index.html`](client/index.html) |

ファイルを開いて右上の鉛筆アイコンから編集し、**Commit changes** を押してください。Actionsタブの **Build and publish UKK Pages** が完了すると反映されます。

## 触らないファイル

ルート直下の `index.html`、`404.html`、`assets/`、`manus-routes.json`、`ukk-logo.svg` は公開用に自動生成されます。直接変更しても、次の元コード更新で上書きされます。編集は必ず `client/` 内の元コードで行ってください。

Googleログイン、部員承認、役職、コンテスト、タスクの保存は別の本番バックエンドが処理します。このリポジトリには**Googleクライアントシークレット、データベース接続情報、部員データ、サーバーコードを入れていません**。
