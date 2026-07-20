# OpenAI Build Week ライセンス・クレジット実装計画

最終更新: 2026-07-20

## 目標

コードをMIT License（Copyright © 2025–2026 hachi-mori）で公開し、画像/GIF、フォント、Score・伴奏、VOICEVOX生成音声を再ライセンスしない適用範囲を明示する。Ryotsuの許諾要約、hachi-mori制作資産、SIL OFL 1.1、VOICEVOX/ずんだもん条件を素材の近くと提出資料へ整合して記録する。英語クレジット画面は英語「あそびかた」画面と同様に読みやすい構造へ改善する。

## 作業基準

- 開始元: `0451a47 公開デモに合わせてBuild Week提出資料を更新`
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
- `LICENSE` / `LICENSE_SCOPE.md`
- `docs/permissions/`
- `web/assets/README.md` / `web/assets/texture/OFL.txt` / `web/assets/demo/NOTICE.md`
- 英語クレジット画面に必要なWeb UIとテスト

## 変更しない範囲

- 教材JSON、音源、Score、画像、追跡中のTTF本体
- C++ / Siv3D版
- 依存関係と公開workflow

## 確定した権利事実

- コード: MIT License、Copyright © 2025–2026 hachi-mori
- 画像/GIF: 全件Ryotsu制作。SingLink公開・Build Week提出用途の許諾根拠を所有者が保管
- 5曲のScore・伴奏: hachi-mori本人が制作し、演奏/打ち込み・書き出し
- フォント: ふてほど丸ゴシック、isMe、SIL Open Font License 1.1。追跡TTF Version 1.000は維持
- 歌声: 公式条件に従い **`VOICEVOX:ずんだもん`** を表示
- 上記素材は、別途明記しない限りルートMITの対象外

## デモについて文書化する事実

- 公開Pagesから `Try fixed quiz demo` を選ぶか `?demo=1` で開始できる。
- 固定順の自作4問に回答した後、回答内容にかかわらず固定の全問正解版を表示する。
- ずんだもんの歌声はVOICEVOX 0.25.1で事前生成済みで、実行時VOICEVOXは不要。
- 「幸せなら手をたたこう」のプロジェクト内Scoreと伴奏を利用した替え歌である。
- 歌声、英語字幕、意味、カラオケ同期を公開環境で確認できる。
- デモは通常モードのリアルタイム生成ではなく、履歴保存対象でもない。
- 通常モードはクイズ回答と選択曲からリアルタイム生成し、ローカルVOICEVOXを必要とする。

## 分担

- 親 GPT-5.6 Sol: 方針、UI統合、検証、コミット
- Terra 構造・分離実装担当: ライセンス配置、権利文書、README・提出資料の整合（UIコードは変更しない）
- Luna監査担当: アセット事実、許諾表現、フォント版差分、テスト候補の読み取り専用監査
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
- MIT/OFL本文、ライセンス適用範囲、素材別クレジットのリンクを確認
- クレジット画面の英語表示とレスポンシブ表示を確認

## 完了条件

- 英語版と日本語版の事実、公開URL、通常経路との区別が一致する。
- 審査員がVOICEVOXなしで公開デモを試せる最短手順がある。
- ローカルVOICEVOXを使う完全な通常モード手順も維持される。
- デモ音源と伴奏の由来、VOICEVOXクレジット、再配布確認事項が台帳化される。
- Build Week開発記録へデモ3コミットと担当分担が追加される。
- 実ブラウザ、テスト、型検査、ビルド、字幕監査、リンク検査、最終レビューが完了する。
- 日本語コミットで保存する。
- MITと個別素材の境界がREADME、NOTICE、素材台帳、画面で矛盾しない。
- 現行Web公開素材に「要証拠」「未決定」の古い記述が残らない。

## 作業手順

- [x] 最新remote、デモ3コミット、既存資料を確認する。
- [x] Terra構造担当とLuna監査担当を起動する。
- [x] README、審査ガイド、技術手順へ公開デモを統合する。
- [x] 開発記録、素材台帳、第三者表記、所有者チェックを更新する。
- [x] 公開Pagesとローカル手順を実ブラウザ・テストで検証する。
- [x] Terra最終レビューを反映する。
- [x] MIT、適用範囲、OFL、Ryotsu許諾要約、デモ音声NOTICEを配置する。
- [x] 英日README、Web README、第三者素材一覧、素材台帳、提出チェックを整合させる。
- [x] 英語クレジット画面を実装し、自動テストとブラウザで確認する。
- [x] 最終レビューと検証を行う。
- [x] 日本語コミットで保存する。

## 2026-07-21 OpenAI Build Week 紹介動画パッケージ

- 目標: 3分未満の落ち着いた英語紹介動画を、英日対訳台本、編集可能なPowerPoint、字幕、仮音声、QA記録とともに完成させる。
- 変更可能範囲: `outputs/build-week-video/`、作業記録、必要な動画生成用スクリプト。
- 完了条件: 実装事実に基づく台本、全スライドの目視確認、仮MP4、字幕・音声、差し替え手順、複数回レビュー、Git保存と必要なpush。
- 制約: C++ / Siv3Dのビルドは行わない。既存素材は2026-07-19の英語UI素材とリポジトリ内のBuild Week画像を優先する。
