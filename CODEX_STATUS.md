# Codex作業状況

最終更新: 2026-07-19

## 現在の状態

4問・4文化、英日UIの重なり解消、Score音符単位のカラオケ同期を実装済み。自動検証、3画面幅、VOICEVOX 4文実音声、差分レビューまで完了。

## Git状態

- ブランチ: `codex/build-week-karaoke-ui`
- 基点: `67e63f8 自作オノマトペ教材を全335語へ拡張`
- `origin/openai-build-week` が基準コミットを含むことを確認済み。
- 開始時の未追跡 `local-only/` は保持。内容へアクセス・変更しない。
- push、PR、デプロイ: 未実施。

## 確認済み

- 日本語教材: 335件。
- 5曲: `memorizationSourceSongs` とテストで維持。
- ランダム4問: `onomatopoeiaQuestionsPerGame = 4` へ変更済み。
- 動的Score: `createMemorizationScore` が `phraseRanges` を返す。
- VOICEVOXフレームレート: 93.75 fps。
- server/direct両経路が同じ `buildMemorizationSynthesisPlan` を使う。
- 結果再生は伴奏と歌声を同じ `AudioContext` 時刻で開始する。

## 設計判断

- 英語教材は別JSONで335件を管理し、語と日本語例文の双方を照合する。
- UI言語はReact Context、ブラウザ言語初期値、localStorage保存で切り替える。
- 同期は `phraseRanges` とScoreの `frame_length` から導出し、固定タイマーは使わない。
- フレーズ時刻を正確にし、現在行のみ左から右へ進捗表示する。

## 検証結果

- `npm.cmd run test`: 6ファイル、29テスト成功。4問定数、4文×5曲、335教材×4文×5曲、音符・休符タイミングを確認。
- `npm.cmd run typecheck`: 成功。
- `npm.cmd run build`: 成功（Vite 1592 modules）。
- `npm.cmd run audit:english-subtitles`: 335/335、監査候補13件。
- `git diff --check`: 成功。
- 1280x720、820x1180、390x844: 横はみ出しなし。英語タイトル、クイズ、正誤、結果、遊び方、履歴を確認。
- VOICEVOX 0.25.1 server経路: 4問へ回答し、4文の実音声生成に成功。
- カラオケ: Score音符の `frame_length / 93.75` で各文字の着色区間を生成。実音声再生で文字が順に着色し、一時停止中400msは値不変、再開後に進行することを確認。
- 1280x720、820x1180、390x844: 4行・4字幕、横はみ出しなし。日本語歌詞と英語字幕、画像内日本語と画像下英語ラベルの重なり0件。
- ブラウザログで検出した開発時ホットリロードの `AudioContext` 二重closeを修正。終了済みContextを再closeせず、失敗も安全に処理する。
- 再生状態: 再実行で0秒復帰、一時停止中はclip値不変、再開後はclip値進行を確認。
- ブラウザコンソール: warning/error 0件。
- C++ / Siv3D、5曲Score/伴奏、`package-lock.json`: 差分なし。
- 読み取り専用レビュー: 重大・中程度の指摘なし。軽微2件を `BACKLOG.md` のBL-008、BL-009へ記録。

## 次の作業

なし。最終Git監査と日本語コミットでの保存まで完了している。

## ブロッカー

なし。
