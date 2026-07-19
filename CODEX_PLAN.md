# OpenAI Build Week デモ対応提出資料更新計画

最終更新: 2026-07-19

## 目標

`openai-build-week` の最新実装 `2bc0f00` に追加された、固定4問と事前生成歌唱によるVOICEVOX不要デモを、英語・日本語README、審査員向け手順、開発記録、第三者素材台帳へ正確に反映する。公開GitHub Pagesで最短評価できる経路と、ローカルVOICEVOXによる通常モードの正式検証経路を明確に分ける。

## 作業基準

- 開始元: 最新 `origin/openai-build-week` (`2bc0f00`)
- 作業ブランチ: `codex/build-week-demo-docs`
- 公開デモ: `https://hachi-mori.github.io/SingLink-Parody-Song-Maker/openai-build-week/`
- 実装事実の正本: コード、Git履歴、テスト、公開Pagesとローカル実ブラウザ確認
- C++ / Siv3Dビルドは実行しない
- push、Pull Request、追加デプロイは行わない

## 変更可能範囲

- `README.md`
- `README.ja.md`
- `web/README.md`
- `THIRD_PARTY_NOTICES.md`
- `docs/asset-inventory.md`
- `docs/judge-testing-guide.md`
- `docs/build-week-development.md`
- `docs/submission-owner-checklist.md`
- `CODEX_PLAN.md`
- `CODEX_STATUS.md`
- 必要な場合の `BACKLOG.md` / `BLOCKERS.md`

## 変更しない範囲

- Webアプリ、教材JSON、音源、Score、画像、フォント
- C++ / Siv3D版
- 依存関係と公開workflow
- LICENSEの最終決定

## デモについて文書化する事実

- 公開Pagesから `Try fixed quiz demo` を選ぶか `?demo=1` で開始できる。
- 固定順の自作4問に回答した後、回答内容にかかわらず固定の全問正解版を表示する。
- ずんだもんの歌声はVOICEVOX 0.25.1で事前生成済みで、実行時VOICEVOXは不要。
- 「幸せなら手をたたこう」のプロジェクト内Scoreと伴奏を利用した替え歌である。
- 歌声、英語字幕、意味、カラオケ同期を公開環境で確認できる。
- デモは通常モードのリアルタイム生成ではなく、履歴保存対象でもない。
- 通常モードはクイズ回答と選択曲からリアルタイム生成し、ローカルVOICEVOXを必要とする。

## 分担

- 親 GPT-5.6 Sol: 方針、事実確認、文章統合、残りの文書編集、検証、コミット
- Terra 構造担当: README、Web README、審査ガイドの限定実装
- Luna監査担当: デモアセット、権利表示、テスト候補の読み取り専用監査（利用可能モデル制約によりTerraで実行）
- Terra 最終レビュー担当: 初稿後の英語・技術・日英整合レビュー（読み取り専用）

## 検証

- `npm.cmd run test`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `npm.cmd run audit:english-subtitles`
- 公開Pagesでデモ開始、4問、結果、再生、字幕、カラオケ同期を確認
- README・文書内の相対リンクと画像リンクを検査
- 記載コマンドと `web/package.json` を照合
- `git diff --check`
- コード・教材・アセット・依存関係に意図しない差分がないことを確認

## 完了条件

- 英語版と日本語版の事実、公開URL、通常経路との区別が一致する。
- 審査員がVOICEVOXなしで公開デモを試せる最短手順がある。
- ローカルVOICEVOXを使う完全な通常モード手順も維持される。
- デモ音源と伴奏の由来、VOICEVOXクレジット、再配布確認事項が台帳化される。
- Build Week開発記録へデモ3コミットと担当分担が追加される。
- 実ブラウザ、テスト、型検査、ビルド、字幕監査、リンク検査、最終レビューが完了する。
- 日本語コミットで保存する。

## 作業手順

- [x] 最新remote、デモ3コミット、既存資料を確認する。
- [x] Terra構造担当とLuna監査担当を起動する。
- [x] README、審査ガイド、技術手順へ公開デモを統合する。
- [x] 開発記録、素材台帳、第三者表記、所有者チェックを更新する。
- [x] 公開Pagesとローカル手順を実ブラウザ・テストで検証する。
- [x] Terra最終レビューを反映する。
- [x] 最終状態を記録し、日本語コミットで保存する。
