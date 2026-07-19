# OpenAI Build Week 提出ドキュメント整備計画

最終更新: 2026-07-19

## 目標

既存プロジェクト SingLink のうち、OpenAI Build Week 提出期間（2026-07-13 09:00 PT〜2026-07-21 17:00 PT）に Codex / GPT-5.6 を用いて追加した Web 版の学習体験を、審査員が短時間で理解・実行・検証できる提出ドキュメントとして完成させる。

## 作業基準

- 作業ブランチ: `codex/build-week-submission-docs`
- 基準コミット: `2ae471f 英語案内と歌詞状態表示を整理`
- 公式期間基準: `c1aab5f` の次のコミットから
- 最終体験差分の中間比較点: `f7da284 オノマトペ100語を出題と歌唱に対応`
- 提出カテゴリ: Education
- 正本: 現在のコード、Git履歴、テスト結果、実ブラウザ確認、VOICEVOX確認記録、Devpostの公式ルールと提出フォーム
- 実装事実と文書が異なる場合は、コードと検証結果を優先し、差異を明記する。

## 変更可能範囲

- `README.md`
- `README.ja.md`
- `web/README.md`
- `THIRD_PARTY_NOTICES.md`
- `docs/asset-inventory.md`
- `docs/judge-testing-guide.md`
- `docs/build-week-development.md`
- `docs/submission-owner-checklist.md`
- `docs/images/build-week/`
- `CODEX_PLAN.md`
- `CODEX_STATUS.md`
- `BACKLOG.md`
- `BLOCKERS.md`
- `web/docs/build-week-implementation-notes.md`
- `web/docs/build-week-rights-audit.md`
- 必要最小限のリンク・文書検証スクリプト

## 変更しない範囲

- Webアプリの機能、教材JSON、楽譜、伴奏、画像、フォント
- C++ / Siv3D版
- 依存関係とプロジェクト設定
- `local-only/` 内の未追跡・非公開素材
- push、Pull Request、デプロイ、Devpostへのプロジェクト作成・提出
- ユーザー確認なしのコードライセンス決定

## 成果物

1. 英語の提出用 `README.md`
2. 日本語版 `README.ja.md`
3. 開発者向け `web/README.md`
4. 審査員向け最短実行手順 `docs/judge-testing-guide.md`
5. Build Week前後の差分とCodex/GPT-5.6利用記録 `docs/build-week-development.md`
6. 第三者ソフトウェア・素材・クレジット一覧 `THIRD_PARTY_NOTICES.md`
7. ファイル単位の素材台帳 `docs/asset-inventory.md`
8. 提出者本人だけが確定できる項目 `docs/submission-owner-checklist.md`
9. 現行Web UIの提出用スクリーンショット（取得できた場合）

## 必須事実

- 学習者は歌わず、4問の日本語オノマトペクイズに答える。
- ずんだもんが4つの正解例文を歌い、日本語歌詞がScore由来のタイミングでカラオケ表示される。
- 英語モードでは英語字幕と意味を表示し、日本語モードでは英語補助を表示しない。
- 所有者提供の語彙順を基に例文・意味・読み・英語補助を新規作成した教材335件、5曲、1プレイ4問を使用する。
- VOICEVOX 0.25.1のローカル接続で実音声確認済みである。
- GitHub Pages単体ではVOICEVOX歌声生成が完結せず、正式な審査経路はWindows上のローカル実行である。
- C++ / Siv3D版はBuild Week期間中の主要評価対象ではない。

## 検証

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

加えて次を確認する。

- README内の相対リンクと画像リンクが存在する。
- README記載コマンドが `web/package.json` と一致する。
- 1280px幅の実ブラウザで英語タイトル、英語How to、4問クイズ、結果画面を確認する。
- VOICEVOX未接続時の挙動と、ローカルVOICEVOXが必要な範囲を文書化する。
- C++ / Siv3Dコード、教材JSON、アセット、依存関係に意図しない差分がない。

## 権利・ライセンス方針

- 法的結論を推測しない。
- 出典URL、ライセンスファイル、許諾記録がない項目は「要証拠」「要確認」とする。
- `VOICEVOX:ずんだもん` のクレジットを明記する。
- 第三者素材をプロジェクトコードのライセンス対象へ含めない。
- リポジトリ全体へ適用するLICENSEは、提出者本人の判断待ちとしてチェックリストと最終報告に残す。

## 完了条件

- 上記成果物が相互リンクされ、英語版と日本語版の事実が一致している。
- Build Week前後の区別がコミットSHA・日付・実装箇所で説明されている。
- セットアップ、サンプルデータ、実行、審査経路、テスト、既知制限がコピー&ペースト可能である。
- 第三者素材の全対象が台帳化され、証拠不足が明示されている。
- Devpostの必須提出項目と提出者本人の残作業がチェックリスト化されている。
- Webテスト、型チェック、ビルド、字幕監査、リンク検査、実ブラウザ確認、レビューが完了している。
- 変更を日本語コミットメッセージで保存している。

## 作業手順

- [x] 基準ブランチ・コミット・長時間作業ファイルを確認する。
- [x] Devpostの公式ルール、締切、審査基準、提出フォームを確認する。
- [x] 実装事実、Git履歴、権利情報、アセットを監査する。
- [x] 提出ドキュメント一式を作成・統合する。
- [x] Webテストと実ブラウザ確認を行い、必要な画像を追加する。
- [x] 英語技術レビューと全体レビューを行う。
- [x] 最終検証、状態更新、日本語コミットを行う。
