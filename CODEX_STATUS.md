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

## 2026-07-21 動画制作チェックポイント1

- 研究発表PDF 1ページとPowerPoint全14スライドを確認した。
- 研究資料からは学習背景と「クイズ→正解→替え歌→同期表示」の流れのみを採用し、古い著作物や将来計画は現行アプリの説明に使用しない。
- 2026-07-19のスクリーンショットと画面録画を監査し、英語How To、英語クイズ、英語結果を優先素材に決定した。
- 7場面、約2分40秒の英日対訳台本、録音用台本、ショットリスト、クレジット草案を `outputs/build-week-video/` に作成した。
- FFmpeg 8.1.2をユーザー環境へ導入した。次はPowerPoint、仮音声、MP4を生成して反復レビューする。

## 2026-07-21 動画制作完了チェックポイント

- `outputs/build-week-video/` に英日対訳台本、録音用英語台本、ショットリスト、字幕、編集可能なPowerPoint、7枚のPNG、仮英語音声、提出用プレビューMP4、確認・差し替え手順、素材・QA記録を整理した。
- 主確認動画は1920×1080、H.264/AAC、132.580秒。実画面録画を中心に構成し、英語字幕を焼き込んだ。
- PowerPointは7枚すべて目視し、`slides_test.py` のoverflow 0、template fidelity issue 0を確認した。
- Terra最終レビューの重大指摘は0件。正解文を歌う仕様、Build Week追加範囲、公開デモと通常モードの差、VOICEVOX・Ryotsu・hachi-mori・フォント表記を修正・再確認した。
- Web検証は10ファイル38テスト、型検査、Vite build（1598 modules）、英語字幕335/335件が成功した。C++ / Siv3Dビルドはリポジトリ指示により未実施。
- 提出者は `00_確認ガイド.md` から確認でき、本人音声への差し替えは `08_朝の音声差し替え手順.md` に従って行える。
- 動画成果物コミット `c535ee0` を `origin/openai-build-week` へpushし、GitHub Pages run `29759245932` のbuild / deploy成功と公開デモHTTP 200を確認した。

詳細は `BLOCKERS.md` と `docs/submission-owner-checklist.md` を参照する。

## 2026-07-21 フルHD提出動画の確定

- V4で確認した額縁、全素材の全体表示、左上テロップ、英語台本全文字幕、クレジットURLを維持して、元素材から1920×1080版を再生成した。
- 35.000–54.704秒はBGMを停止し、35.000秒から公開デモ動画の音声トラックを映像と同期して追加した。
- 107.544–116.210秒と144.851–152.851秒のBGM停止を維持し、152.851秒以降は動画素材音声を追加せずBGMを再開した。
- scene2とscene3の元動画時刻を27.505秒で連続させ、素材末尾は最終フレーム保持で補完した。
- 完成動画は `outputs/build-week-video/SingLink_OpenAI_Build_Week_fullhd.mp4`。1920×1080、24fps、H.264/AAC 48kHz stereo、166.542秒、24,753,843 bytes。
- 全編デコード、黒画面なし、BGM停止区間、字幕19キュー、最終URL表示を確認した。SHA-256は `21E4CFFC4C8CF03000C23DB2B72DDC9DC11BCD8CDB8F4AA000B15D455ADC19A0`。
- 録音済みPowerPointのユーザー変更は変更・ステージングしていない。

## 2026-07-21 提出動画資料の公開

- 最終動画、英語字幕、クレジット画像、制作・QA記録をコミット `d7bf0d4` として `openai-build-week` へpushした。
- GitHub Pages run `29840135193` でmain / Build Week双方のテスト、ビルド、デプロイが成功した。
- 公開デモ `https://hachi-mori.github.io/SingLink-Parody-Song-Maker/openai-build-week/` のHTTP 200とページタイトルを確認した。
- YouTube限定公開URLは未発行のため、READMEと審査ガイドへの動画リンク追加はアップロード後に行う。

## 2026-07-22 YouTube導線と提出用サムネイル

- 限定公開YouTube動画 `https://youtu.be/B1NkSrOzdA8` のHTTP 200とYouTube再生URLへのリダイレクトを確認した。
- `docs/images/build-week/openai-build-week-thumbnail.png` を追加し、英語・日本語READMEで画像をクリックするとYouTube動画を開くようにした。
- 審査員向け手順、提出者チェックリスト、動画制作ノート、素材台帳、第三者素材一覧へ動画URLとサムネイルの出典・クレジット範囲を反映した。
- `web` の `npm.cmd run test` は10ファイル・38テスト成功。ユーザー編集のPowerPointとローカルの低解像度レビュー素材はステージング対象外。
