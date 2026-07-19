# OpenAI Build Week GitHub Pages 分離公開計画

最終更新: 2026-07-19

## 目標

既存のmain版を `https://hachi-mori.github.io/SingLink-Parody-Song-Maker/` に維持しながら、`openai-build-week` ブランチのWeb版を `https://hachi-mori.github.io/SingLink-Parody-Song-Maker/openai-build-week/` で審査員が確認できるGitHub Pages成果物を自動生成する。

## 作業基準

- 作業ブランチ: `codex/build-week-submission-docs`
- 作業開始HEAD: `bc13839 提出資料の完了状態を記録`
- 公開元ブランチ: `main` と `openai-build-week`
- 正本: `.github/workflows/pages.yml`、両ブランチの追跡内容、Vite設定、ローカルで再現したPages成果物

## 変更可能範囲

- `.github/workflows/pages.yml`
- `web/scripts/copy-assets.mjs`
- `CODEX_PLAN.md`
- `CODEX_STATUS.md`
- 計画外の問題が見つかった場合の `BACKLOG.md` / `BLOCKERS.md`

## 変更しない範囲

- Webアプリの画面機能、教材JSON、楽譜、伴奏、画像、フォント
- `README.md`、`README.ja.md`、`web/README.md`、審査員向けガイド
- C++ / Siv3D版
- 依存関係とプロジェクト設定
- GitHub Pages設定そのもの、push、Pull Request、実デプロイ

READMEと審査ガイドは、提出者が実URLを確認した後の別工程で更新する。

## 公開構成

```text
GitHub Pages artifact
├─ /                         <- main の web/dist/client
└─ /openai-build-week/       <- openai-build-week の web/dist/client
```

- `main` または `openai-build-week` へのpushと手動実行で、両方を毎回ビルドする。
- イベント発生ブランチの暗黙checkoutに依存せず、各refを明示して取得する。
- 2つの成果物を1つのPages artifactへ統合してから1回だけデプロイする。
- Viteの `base: './'` と `import.meta.env.BASE_URL` により、ルートとサブパスの両方で静的資産を相対解決する。

## 運用上の前提

- GitHub Pagesはこのリポジトリに1つなので、main版とBuild Week版は単一artifact内の別パスとして共存させる。
- mainの更新でBuild Week版が消えないよう、同じ統合ワークフローをmainにも反映する必要がある。
- Build Week版のワークフローだけを先に反映しても公開テストはできるが、その後mainが旧ワークフローでデプロイするとサブパスが消える。
- GitHub Pagesは静的配信のみ。ローカルVOICEVOX歌唱の制約は変わらない。

## 検証

- YAMLとして読み取れる。
- workflowが `main` / `openai-build-week` / `workflow_dispatch` を対象にする。
- mainとopenai-build-weekを明示refでcheckoutする。
- Node.js 22、`npm ci`、`npm run build` を両方へ実行する。
- main成果物をルート、Build Week成果物を `openai-build-week/` に配置する。
- `actions/configure-pages@v5`、`actions/upload-pages-artifact@v4`、`actions/deploy-pages@v4` を使用する。
- Build Week版の静的素材コピー後もVite生成JS/CSSが残る。
- ローカルで両ブランチをビルドし、統合成果物の2つの `index.html` と参照資産を確認する。
- 静的サーバーで `/` と `/openai-build-week/` を実ブラウザ確認する。
- 現行Webテスト、型検査、ビルド、字幕監査を実行する。
- `git diff --check` と独立した差分レビューを行う。

## 完了条件

- main版を維持したままBuild Week版を専用サブパスへ出すworkflowが実装されている。
- 両ブランチ更新時の上書き事故を防ぐ統合デプロイになっている。
- ローカル再現とブラウザ確認が成功している。
- README類はユーザー確認前の状態を維持している。
- 変更が日本語コミットで保存されている。

## 作業手順

- [x] 既存Pages workflow、Vite base、ブランチ状態を確認する。
- [x] 統合Pages workflowを実装する。
- [x] 両ブランチのビルドと統合成果物をローカル再現する。
- [x] ルート版とBuild Weekサブパス版を実ブラウザ確認する。
- [x] Web検証、差分レビュー、状態更新を行う。
- [x] 日本語コミットで保存する。
