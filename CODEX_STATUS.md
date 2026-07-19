# Codex作業状況

最終更新: 2026-07-19

## 現在の状態

OpenAI Build Week提出版の実装、全検証、実画面・実音声確認、独立レビュー、日本語コミットでの保存まで完了。

## Git状態

- ブランチ: `codex/build-week-karaoke-ui`
- 基点: `67e63f8 自作オノマトペ教材を全335語へ拡張`
- `origin/openai-build-week` が基準コミットを含むことを確認済み。
- 開始時の未追跡 `local-only/` は保持。内容へアクセス・変更しない。
- push、PR、デプロイ: 未実施。

## 確認済み

- 日本語教材: 335件。
- 5曲: `memorizationSourceSongs` とテストで維持。
- ランダム3問: `takeShuffled(..., 3)` 相当の定数 `onomatopoeiaQuestionsPerGame = 3` を確認。
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

- `npm.cmd run test`: 6ファイル、27テスト成功。
- `npm.cmd run typecheck`: 成功。
- `npm.cmd run build`: 成功（Vite 1592 modules）。
- `npm.cmd run audit:english-subtitles`: 335/335、監査候補13件。
- `git diff --check`: 成功。
- 1280x720、820x1180、390x844: 横はみ出しなし。英語タイトル、クイズ、正誤、結果、遊び方、履歴を確認。
- VOICEVOX 0.25.1 server経路: 「雪」で代表3問の実音声生成成功。
- カラオケ: 3字幕、左から右の塗り、3フレーズ遷移を確認。
- 再生状態: 再実行で0秒復帰、一時停止中はclip値不変、再開後はclip値進行を確認。
- ブラウザコンソール: warning/error 0件。
- C++ / Siv3D、5曲Score/伴奏、`package-lock.json`: 差分なし。
- 読み取り専用レビュー: 重大・中程度の指摘なし。軽微2件を `BACKLOG.md` のBL-008、BL-009へ記録。

## 次の作業

なし。最終差分監査と日本語コミットでの保存まで完了している。

## ブロッカー

なし。
