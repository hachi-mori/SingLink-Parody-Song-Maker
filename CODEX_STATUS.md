# Codex 作業状況

最終更新: 2026-07-20

## 現在の状態

公開固定デモの提出資料統合後、所有者が確定したコードライセンスと公開素材の権利事実を実装した。ライセンス・権利文書、英語クレジット画面、自動検証、3画面幅のブラウザ確認、独立した最終レビューまで完了した。

- 作業ブランチ: `codex/build-week-demo-docs`
- 作業開始HEAD: `0451a47`
- 教材JSON、Score、音源、画像、追跡TTF本体、依存関係: 変更なし
- push、Pull Request、追加デプロイ: 未実施

## 2026-07-20 ライセンス・権利文書

- `LICENSE`: MIT License、Copyright © 2025–2026 hachi-mori
- `LICENSE_SCOPE.md`: MIT対象をプロジェクト所有コード・文書へ限定し、個別素材を分離
- `docs/permissions/ryotsu-assets.md`: 全画像/GIFの作者をRyotsuへ統一し、SingLink公開・Build Week提出用途の許諾根拠を公開要約
- `web/assets/texture/OFL.txt`: ふてほど丸ゴシックのSIL OFL 1.1全文をフォントの隣へ配置
- `web/assets/demo/NOTICE.md`: 事前生成WAVのVOICEVOX版・話者・クレジット・元資産を記録
- `web/assets/README.md`: 素材ディレクトリが一括してMITにならないことを明示
- `THIRD_PARTY_NOTICES.md` / `docs/asset-inventory.md`: hachi-mori制作の5曲Score・伴奏、VOICEVOX条件、フォント公式配布元・hashを更新
- 英日README、Web README、審査ガイド、提出チェック、ブロッカー、バックログを上記事実へ整合
- 英語クレジット画面: 英語「あそびかた」と同様の読みやすいカード構造へ変更。日本語は既存のStaticImage表示を維持

### ライセンス実装後の自動確認

- `npm.cmd run test`: 10ファイル、38件成功
- `npm.cmd run typecheck`: 成功
- `npm.cmd run build`: 成功、Vite 8.0.16、1598 modules transformed
- `npm.cmd run audit:english-subtitles`: 335/335件成功
- ビルド成果物に `assets/texture/OFL.txt`、`assets/demo/NOTICE.md`、demo manifestが存在
- 英語クレジット画面: 1440px、768px、390px幅で横overflowなし。MIT、hachi-mori、Ryotsu、VOICEVOX、フォント表記を確認
- Markdown相対リンク: 今回変更した提出資料の欠落0件。既存Siv3D同梱フォントREADMEの画像リンク4件は今回の対象外
- 公開画像/GIF内訳: button PNG 6件、直下PNG 12件、GIF 7件、合計25件
- `git diff --check`: 成功
- C++ / Siv3Dビルド: リポジトリ指示により未実施
- Terra最終レビュー: 重大0件、中程度0件。日本語旧クレジット画像との表記差を文書上で明確化し、軽微指摘を反映

## 更新した提出資料

- `README.md`: 英語READMEの冒頭へ準備不要の公開デモと制約を追加
- `README.ja.md`: 日本語版へ同じ公開経路と通常モードとの差を追加
- `web/README.md`: 静的デモ、ローカルデモ、リアルタイム生成の技術経路を分離
- `docs/judge-testing-guide.md`: GitHub Pagesを最短経路、Windows + VOICEVOXを完全な通常モード経路として整理
- `docs/build-week-development.md`: デモ3コミット、実装証拠、AI分担、確認実績を追加
- `THIRD_PARTY_NOTICES.md`: 公開配布される事前生成WAVとScore・伴奏への依存を追加
- `docs/asset-inventory.md`: demo manifest、事前生成WAV、hash、公開・ダウンロード状態を追加
- `docs/submission-owner-checklist.md`: 審査URL、デモWAV、Score・伴奏、再生成時の確認を追加
- `CODEX_PLAN.md` / `CODEX_STATUS.md`: 今回の目標、分担、完了状態を記録

古い `Tohoku-procon2025` のclone URLとコミットリンクは、現在の `SingLink-Parody-Song-Maker` へ統一した。

## デモの文書化事実

- 公開URL: `https://hachi-mori.github.io/SingLink-Parody-Song-Maker/openai-build-week/`
- 直リンク: `https://hachi-mori.github.io/SingLink-Parody-Song-Maker/openai-build-week/?demo=1`
- 固定順4問: `きらきら`、`しとしと`、`すやすや`、`りんりん`
- クイズ中は回答の正誤を表示するが、完了後は入力内容にかかわらず固定の全問正解結果を使う
- 歌声: VOICEVOX 0.25.1、speaker 3003、ずんだもん ノーマルで事前生成
- 曲: プロジェクト内の「幸せなら手をたたこう」Score・伴奏
- 実行時VOICEVOX: 不要
- デモ結果: 履歴へ保存しない。WAVは結果画面からダウンロード可能
- 通常モード: 回答と選択曲からリアルタイム生成し、ローカルVOICEVOXが必要

## 分担結果

- 親 GPT-5.6 Sol: 方針、Git・コード事実確認、文章統合、権利文書編集、実ブラウザ、自動検証、コミット
- Terra構造担当: README、Web README、審査ガイドを限定範囲で実装
- Luna監査担当: デモアセット、hash、配布状態、権利記述、テスト候補を読み取り専用監査。Lunaモデルは利用できないためTerraモデルで独立実行
- Terra最終レビュー担当: 英語、技術事実、日英整合、URL、コマンド、権利表現を読み取り専用レビュー

## 自動検証

2026-07-19に実行した。

- `npm.cmd run test`: 9ファイル、37件成功
- `npm.cmd run typecheck`: 成功
- `npm.cmd run build`: 成功、Vite 8.0.16、1596 modules transformed
- `npm.cmd run audit:english-subtitles`: 335/335件、人手確認候補13件
- ビルド成果物: demo manifest、事前生成WAV、伴奏、Scoreがすべて存在
- Markdown相対リンク・画像: 39件検査、欠落0件
- 文書内コミット参照: 21件検査、不明0件
- `git diff --check`: 成功
- C++ / Siv3Dビルド: リポジトリ指示により未実施

## 公開Pagesの実ブラウザ確認

- 最新 `2bc0f00` のGitHub Actions run `29690051277`: build / deploy成功
- タイトルの `Try fixed quiz demo` から開始できる
- `?demo=1` でタイトルを介さず固定4問へ進む
- 4問を完走し、英語の正誤・意味表示を確認
- 結果に `Pre-generated demo`、曲名、4つの日本語歌詞、英訳、意味を表示
- `VOICEVOX:ずんだもん` と曲アセットのクレジットを表示
- Play後に `Pause` へ変わり、最初の歌詞行が `karaoke-line--active` になることを確認
- 公開画面と直リンクで、Chrome制御拡張由来とみられる汎用message-channelエラーを各3件記録したが、アプリの表示・クイズ・再生・同期失敗は再現しなかった

## レビュー結果

- Terra最終レビュー: 重大0件、中1件、軽微0件
- 中1件: 審査ガイドの「30秒」見出しがWAV 16.053秒と混同されるため、時間を断定しない「固定4問」へ修正済み
- 修正後のURL、固定4問、入力非依存デモ、通常モード、VOICEVOXクレジット、9ファイル37テスト、3コミットは整合

## 提出者本人の残作業

- 動画または概要欄にも `VOICEVOX:ずんだもん` とRyotsuのクレジットを表示する
- `/feedback` で正式Session IDを取得する
- 3分未満のYouTube動画とDevpost本文を本人の言葉で完成させる

詳細は `BLOCKERS.md` と `docs/submission-owner-checklist.md` を参照する。
