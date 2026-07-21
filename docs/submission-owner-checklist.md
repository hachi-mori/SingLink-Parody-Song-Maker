# OpenAI Build Week 提出者本人チェックリスト

更新日: 2026-07-22

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
- [ ] [2分47秒のYouTubeデモ動画](https://youtu.be/B1NkSrOzdA8)
- [ ] 動画をPublicまたはUnlistedで、未ログイン・シークレットウィンドウから再生確認する
- [ ] 動画の音声で「何を作ったか」「Codexをどう使ったか」「GPT-5.6をどう使ったか」を説明する
- [ ] 動画に許諾のない第三者商標・音楽・素材を含めていないことを確認する
- [ ] コードリポジトリURL
- [ ] 審査URLとして `https://hachi-mori.github.io/SingLink-Parody-Song-Maker/openai-build-week/?demo=1` を未ログイン環境で確認する
- [ ] READMEのセットアップ、サンプルデータ、実行、Codex/GPT-5.6利用説明
- [ ] コア機能を主に実装したCodexタスクで `/feedback` を実行し、返された正式Session IDを入力する

Session IDはGit SHA、CodexタスクID、会話URLから推測しないでください。

## コードリポジトリ

- [ ] 提出するブランチ/コミットに、このドキュメントコミットが含まれる
- [ ] `README.md` の `git switch openai-build-week` が実際の提出ブランチと一致する
- [x] コードをMIT License、Copyright © 2025–2026 hachi-moriとしてルート `LICENSE` へ追加する
- [ ] Privateにする場合、`testing@devpost.com` と `build-week-event@openai.com` へアクセスを付与する
- [x] `LICENSE_SCOPE.md` で画像、フォント、音声、Score、生成歌声、第三者依存をMIT対象外とする
- [ ] GitHub上の全相対リンクと画像を確認する
- [ ] `local-only/` と秘密情報が追跡されていないことを確認する

## 素材・権利

- [x] [asset-inventory.md](asset-inventory.md) に現行Web公開素材の作者・条件・クレジットを記録する
- [x] 25件の画像/GIFをRyotsu制作として、SingLink公開・Build Week提出用途の許諾要約を保存する
- [x] ずんだもん画像について、Ryotsuの許諾根拠とキャラクター利用ガイドラインの両方を記録する
- [x] `Futehodo-MaruGothic.ttf` の公式配布元とSIL OFL 1.1を確認し、`web/assets/texture/OFL.txt` を配置する
- [x] 5つの伴奏WAVをhachi-mori本人の制作・演奏/打ち込み・書き出しとして記録する
- [x] 5つのScore JSONをhachi-mori本人の制作として記録し、`オノマトペ.vvproj` を個別条件の所有者管理資産として分離する
- [x] 335語の入力元CSV第3列を利用できるという所有者確認を記録する
- [x] VOICEVOXとずんだもん音源の公式規約、商用・非商用利用、必要クレジットを確認する
- [x] READMEとアプリの英語クレジット画面へ **`VOICEVOX:ずんだもん`** を記載する
- [ ] 動画内または概要欄へ **`VOICEVOX:ずんだもん`** とRyotsuのクレジットを記載する
- [x] `web/assets/demo/zundamon-shiawase-demo.wav` の生成条件と公開時のVOICEVOX/ずんだもん条件を `web/assets/demo/NOTICE.md` に記録する
- [x] デモWAVが参照する「幸せなら手をたたこう」のScore・伴奏をhachi-mori制作として記録する
- [ ] デモ音源を再生成した場合はVOICEVOX版、speaker/style、manifest、WAV hash、台帳を更新する
- [ ] 動画内の歌声・伴奏・キャラクター画像も各条件を満たすことを確認する

現行Web公開素材について、公開を妨げる未解決項目は台帳に残っていません。動画では **`VOICEVOX:ずんだもん`** とRyotsuのクレジットを確認し、素材を変更した場合は公式条件と許諾範囲を再確認します。

## デモ動画の推奨確認順

- [ ] 0:00–0:20 公開固定デモのURL、問題と対象学習者、事前生成であること
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
- [ ] 審査URLへGitHub Pagesの `?demo=1` 直リンクを入力し、通常モードはローカルVOICEVOXが必要と補足する
- [ ] `/feedback` Session IDを入力する
- [ ] 動画URL `https://youtu.be/B1NkSrOzdA8` を入力する
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

- [ ] 9ファイル・37テスト成功
- [ ] 型チェック成功
- [ ] ビルド成功
- [ ] 英語字幕335/335
- [ ] READMEリンク検査成功
- [ ] 最新コミットから審査員手順を新しい環境で実行できる
- [ ] 1280px幅で英語タイトル、How to、クイズ、結果を確認する
- [ ] `Try fixed quiz demo` と `?demo=1` の両方から固定順4問の事前生成デモを開き、回答後にVOICEVOXなしで再生・字幕・同期を確認する
- [ ] VOICEVOX 0.25.1または提出時に使う版で歌声を再確認する
- [ ] 動画の表示とREADMEの表示が一致する
- [ ] 最終提出後、Devpostの公開ページを確認する
