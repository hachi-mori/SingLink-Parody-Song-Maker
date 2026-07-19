# Codex 作業状況

最終更新: 2026-07-19

## 現在の状態

OpenAI Build Week版を既存main版と共存させるGitHub Pages統合workflowを実装し、ローカル再現とブラウザ確認を完了した。

- ブランチ: `codex/build-week-submission-docs`
- 作業開始HEAD: `bc13839 提出資料の完了状態を記録`
- 作業開始時の `origin/openai-build-week`: `bc13839` と一致
- 作業ツリー: 開始時クリーン
- README、審査ガイド、Web画面機能、教材、依存関係: 変更なし
- push: `openai-build-week` と `main` へ実施済み
- Pull Request: ユーザー指定により未作成
- GitHub Actionsによる実デプロイ: push後のworkflowで実行

## 確認済み

- 現行 `.github/workflows/pages.yml` はmainへのpushで `web/dist/client` だけをPagesへデプロイする。
- 現在の公開URLは `https://hachi-mori.github.io/SingLink-Parody-Song-Maker/`。
- GitHub Pagesはリポジトリ単位の単一サイトであり、別ブランチ版は同一artifactのサブパスへ統合する必要がある。
- `web/client/vite.config.ts` は `base: './'`。
- アプリの資産URLと静的API経路は `import.meta.env.BASE_URL` を使うため、サブパス配信に対応できる構造である。
- GitHub公式ドキュメントでは、custom workflowでPages artifactをアップロードし、`pages: write` と `id-token: write` を持つdeploy jobから公開する。
- mainの `copy-assets.mjs` はVite生成物を保持するが、Build Week版は公開許可リスト化時に `dist/client/assets` 全体を削除する実装となり、生成済みJS/CSSが消えることを成果物参照検査で再現した。

## 実装内容

1. workflowをmainとopenai-build-weekのpush、および手動実行で起動する。
2. 両refを別ディレクトリへcheckoutし、それぞれで `npm ci`、`npm test`、`npm run build` を実行する。
3. main成果物をルート、Build Week成果物を `openai-build-week/` へ配置し、統合artifactを1回だけPagesへデプロイする。
4. ActionsのSummaryへmain版とBuild Week版のURLを表示する。
5. `copy-assets.mjs` は管理対象の静的素材ディレクトリだけを掃除し、Viteが生成したJS、CSS、フォントを保持する。

想定公開URL:

- main: `https://hachi-mori.github.io/SingLink-Parody-Song-Maker/`
- OpenAI Build Week: `https://hachi-mori.github.io/SingLink-Parody-Song-Maker/openai-build-week/`

## 検証結果

2026-07-19に次を確認した。

- `origin/main` (`c1aab5f`) の隔離ビルド: 2ファイル、9テスト成功、型検査・ビルド成功
- `origin/openai-build-week` (`bc13839`) の隔離テスト: 7ファイル、33テスト成功
- 修正後の作業ブランチ: `npm.cmd run test` 33件成功、`npm.cmd run typecheck` 成功、`npm.cmd run build` 成功
- `npm.cmd run audit:english-subtitles`: 335/335件、人手確認候補13件
- 統合成果物: ルート版と `openai-build-week/` 版の `index.html`、JS、CSS参照がすべて存在
- 両版のJS bundleは別hashであり、mainとBuild Weekの内容を混同していない
- ローカル静的サーバー: `/` と `/openai-build-week/` がHTTP 200
- 実ブラウザ: ルートは日本語main画面、サブパスは英語Build Week画面を表示
- Build Week版の画像、JS、CSS URLはすべてサブパス内の相対URLとして解決
- ブラウザwarning/error: 0件
- workflow構成検査: checkout 2回、test 2回、build 2回、Pages actionと両branch指定を確認
- `git diff --check`: 成功
- C++ / Siv3Dビルド: リポジトリ指示により未実施
- 差分レビュー: 重大・中程度の指摘なし

## 注意点

- `openai-build-week`: `e4b1c5c Build Week版をPagesの専用URLで公開可能にする` を反映済み。
- `main`: `120d56b Build Week版のPages公開経路をmainへ反映` を反映済み。
- 両ブランチの `.github/workflows/pages.yml` は同一内容である。
- ユーザー確認前はREADMEと審査ガイドを変更しない。
- GitHub Pages単体ではローカルVOICEVOX歌唱を保証しない。
- 検証用一時成果物は実行ポリシーにより自動削除できず、`C:\Users\yaega\AppData\Local\Temp\singlink-pages-verify-f98678c2d16649329b4fd353fce4d5c8` に残っている。作業tree登録とローカルサーバーは削除・停止済み。
