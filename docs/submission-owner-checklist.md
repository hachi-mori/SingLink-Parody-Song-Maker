# OpenAI Build Week 提出者本人チェックリスト

更新日: 2026-07-19

この文書はAI生成文をそのままDevpost本文へ提出するためのものではありません。提出者本人が事実を確認し、自分の言葉へ直し、外部公開・権利・本人情報を確定するためのチェックリストです。公式入口は [OpenAI Build Week on Devpost](https://openai.devpost.com/) です。

## 締切とカテゴリ

- [ ] 締切を再確認する: 2026-07-21 17:00 PT / 2026-07-22 09:00 JST
- [ ] Devpostの最新Announcementsを確認する
- [ ] カテゴリは `Education` を選ぶ
- [ ] プロジェクト名は既存名 `SingLink` を維持する
- [ ] チームメンバーがいる場合、締切前に招待承認まで完了する

## 必須提出物

- [ ] 動作するプロジェクト
- [ ] 機能と仕組みを説明する本人のProject description
- [ ] 3分未満のYouTubeデモ動画
- [ ] 動画をPublicまたはUnlistedで、未ログイン・シークレットウィンドウから再生確認する
- [ ] 動画の音声で「何を作ったか」「Codexをどう使ったか」「GPT-5.6をどう使ったか」を説明する
- [ ] 動画に許諾のない第三者商標・音楽・素材を含めていないことを確認する
- [ ] コードリポジトリURL
- [ ] READMEのセットアップ、サンプルデータ、実行、Codex/GPT-5.6利用説明
- [ ] コア機能を主に実装したCodexタスクで `/feedback` を実行し、返された正式Session IDを入力する

Session IDはGit SHA、CodexタスクID、会話URLから推測しないでください。

## コードリポジトリ

- [ ] 提出するブランチ/コミットに、このドキュメントコミットが含まれる
- [ ] `README.md` の `git switch openai-build-week` が実際の提出ブランチと一致する
- [ ] Publicにする場合、リポジトリ全体のコードライセンスを決定し、関連するLICENSEを追加する
- [ ] Privateにする場合、`testing@devpost.com` と `build-week-event@openai.com` へアクセスを付与する
- [ ] 第三者素材をコードのライセンス対象へ含めない
- [ ] GitHub上の全相対リンクと画像を確認する
- [ ] `local-only/` と秘密情報が追跡されていないことを確認する

## 素材・権利

- [ ] [asset-inventory.md](asset-inventory.md) の **要証拠** をすべて確認する
- [ ] 25件の画像/GIFについて、作者、配布元、許諾、改変、GitHub公開、Devpost提出、動画利用、再配布の可否を記録する
- [ ] ずんだもん画像について、画像制作者の許諾とキャラクター利用ガイドラインの両方を確認する
- [ ] `Futehodo-MaruGothic.ttf` の公式配布元、ライセンス本文、Web配信・再配布条件、必要表記を確認する
- [ ] 5つの伴奏WAVについて、原曲、編曲、演奏/音源制作者、録音、改変、再配布、動画利用の根拠を記録する
- [ ] 5つのScore JSONと `オノマトペ.vvproj` の作成者・由来・改変/配布条件を記録する
- [ ] 335語の入力元CSV第3列を利用できる根拠を保存する
- [ ] VOICEVOXとずんだもん音源の最新規約を本人が確認する
- [ ] README、アプリ紹介画面、動画内または概要欄へ **`VOICEVOX:ずんだもん`** を記載する
- [ ] 動画内の歌声・伴奏・キャラクター画像も各条件を満たすことを確認する

権利の最終判断はこのドキュメントやCodexではなく、提出者本人が根拠資料を読んで行います。

## デモ動画の推奨確認順

- [ ] 0:00–0:20 問題と対象学習者
- [ ] 0:20–0:40 英語タイトル、5曲、4問、How to
- [ ] 0:40–1:20 4問クイズ
- [ ] 1:20–2:00 ずんだもんの歌声、日本語歌詞、英訳、カラオケ同期
- [ ] 2:00–2:25 Score frame同期、335件、5曲、レスポンシブの技術説明
- [ ] 2:25–2:50 Codex/GPT-5.6が加速した作業と人間の判断
- [ ] 2:50までに締め、3:00を超えない

上記は構成案です。説明文は提出者本人の言葉へ直してください。

## Devpostフォーム

- [ ] Project taglineを本人の言葉で作る（200文字以内）
- [ ] Project descriptionを本人の言葉で作り、実装事実とREADMEへ照合する
- [ ] Built withに実際の技術だけを記載する（例: Codex, GPT-5.6, React, TypeScript, Vite, Fastify, VOICEVOX）
- [ ] Country of residenceを本人が選ぶ
- [ ] CategoryにEducationを選ぶ
- [ ] リポジトリURLを入力する
- [ ] 必要なら審査URL・ローカル手順欄へ [judge-testing-guide.md](judge-testing-guide.md) の要点を本人の言葉で記載する
- [ ] `/feedback` Session IDを入力する
- [ ] 動画URLを入力する
- [ ] サムネイルとチーム情報を確認する
- [ ] Official Rules、参加資格、知的財産、第三者連携条件へ本人が同意する

## 最終技術確認

```powershell
cd web
npm.cmd run test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run audit:english-subtitles

cd ..
git diff --check
git status --short
```

- [ ] 7ファイル・33テスト成功
- [ ] 型チェック成功
- [ ] ビルド成功
- [ ] 英語字幕335/335
- [ ] READMEリンク検査成功
- [ ] 最新コミットから審査員手順を新しい環境で実行できる
- [ ] 1280px幅で英語タイトル、How to、クイズ、結果を確認する
- [ ] VOICEVOX 0.25.1または提出時に使う版で歌声を再確認する
- [ ] 動画の表示とREADMEの表示が一致する
- [ ] 最終提出後、Devpostの公開ページを確認する
