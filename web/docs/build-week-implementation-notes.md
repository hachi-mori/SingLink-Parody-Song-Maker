# OpenAI Build Week 提出版 実装記録

更新日: 2026-07-19

## 提出機能

- 英語・日本語UI切替（保存済み値が `ja` の場合だけ日本語、それ以外は英語で開始し、`localStorage` へ保存）
- 自作335教材の英語意味・英訳例文
- 4問の結果を日本語歌詞、英語字幕、英語意味で表示
- VOICEVOX歌声と同期するカラオケ風フレーズ表示
- 再生、一時停止、再開、もう一度、終了の再生状態管理
- 1280x720、820x1180、390x844のレスポンシブ対応
- `prefers-reduced-motion` 時は拡大や遷移を止め、Score由来の着色位置は維持

## 英語データ

`assets/dict/cards_english_data.json` はUI辞書から独立し、次のフィールドを持つ。

```json
{
  "onomatopoeia": "わくわく",
  "meaning": "Excitedly looking forward to something.",
  "exampleJapanese": "えんそくまえでわくわくする。",
  "exampleEnglish": "I feel excited before the field trip.",
  "reviewStatus": "reviewed"
}
```

- `onomatopoeia` で日本語教材と結合する。
- `exampleJapanese` の完全一致を照合し、別の例文へ誤って字幕を付けない。
- UI上の欠損フォールバックは `Translation unavailable`。テストでは欠損、空欄、重複、例文不一致を失敗させる。
- `reviewStatus: needsReview` は `npm.cmd run audit:english-subtitles` で一覧化する。
- 全件監査用Markdown表は `node scripts/audit-english-subtitles.mjs --all` で標準出力へ生成できる。

## カラオケ同期

1. 選択した5曲の基礎Scoreへ、既存 `createMemorizationScore` で4例文を割り当てる。
2. 戻り値の `phraseRanges` を4行の対応範囲として使う。
3. 各範囲に含まれる全音符の `ScoreNote.frame_length` を、VOICEVOXの93.75 fpsで開始・終了秒へ変換する。
4. 歌唱音符へ行内の着色区間を割り当て、休符では着色位置を保持する。
5. `AudioContext.currentTime` と保存した再生オフセットから現在時刻を更新する。
6. テキストの状態ラベルは置かず、境界、色、文字単位の進行で現在位置を示す。
7. 歌唱中は現在の音符区間内だけ日本語の着色を進め、音の長い文字ほど長く色が変わるようにする。

合成時に第2〜第4フレーズへ加える2 frameの安定化休符はWAVから除去されるため、表示時刻へ加算しない。server経路とブラウザ直接経路は同じScore生成・合成計画を使う。

## Codex / GPT-5.6 Sol 利用記録

- 親エージェント: Git基準確認、既存フロー調査、データモデル、335英訳、i18n、カラオケ同期、統合、テスト、ブラウザ確認、VOICEVOX実音声確認、コミット。
- 読み取り専用調査エージェント: Score/frame/phraseRanges/伴奏同期の追跡、英語UI文字列と画像焼込み文字の監査。
- 読み取り専用レビューエージェント: 実装後差分の独立レビュー。
- Codexが加速した部分: 335件対応照合、5曲の音符frame境界検証、3幅のブラウザ操作、停止・再開時の進捗比較、字幕監査表の自動生成。

## 人間が決めた設計判断

ユーザー指定を正本として、次を維持した。

- 学習者は歌わず、ずんだもんが正解例文を歌う。
- 1プレイ4問、5曲、自作335教材を維持する。
- 日本語のオノマトペと例文を主表示、英語を操作補助と字幕にする。
- 出版社教材由来データを復活させない。
- VOICEVOXへ渡すScore音符の実フレームを文字着色の正本にする。
- C++ / Siv3D版を変更しない。
- push、PR、デプロイは別途明示依頼があるまで行わない。

提出期間のコミット時系列と検証証跡は、リポジトリ直下の [`docs/build-week-development.md`](../../docs/build-week-development.md) を正本とする。
