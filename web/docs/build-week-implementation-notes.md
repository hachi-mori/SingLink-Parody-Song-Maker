# OpenAI Build Week 提出版 実装記録

更新日: 2026-07-19

## 提出機能

- 英語・日本語UI切替（ブラウザ言語を初期値にし、`localStorage` へ保存）
- 自作335教材の英語意味・英訳例文
- 3問の結果を日本語歌詞、英語字幕、英語意味で表示
- VOICEVOX歌声と同期するカラオケ風フレーズ表示
- 再生、一時停止、再開、もう一度、終了の再生状態管理
- 1280x720、820x1180、390x844のレスポンシブ対応
- `prefers-reduced-motion` 時は文字内の連続塗りを停止し、フレーズ単位の状態表示へ縮退

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

1. 選択した5曲の基礎Scoreへ、既存 `createMemorizationScore` で3例文を割り当てる。
2. 戻り値の `phraseRanges` を3行の対応範囲として使う。
3. 各範囲の `ScoreNote.frame_length` を合計し、VOICEVOXの93.75 fpsで秒へ変換する。
4. `AudioContext.currentTime` と保存した再生オフセットから現在時刻を更新する。
5. 未歌唱・歌唱中・歌唱済みをラベル、記号、サイズ、境界、色で区別する。
6. 歌唱中はフレーズ内の経過率で日本語を左から右へ塗る。文字単位の時刻を推測せず、フレーズ境界の正確さを優先する。

合成時に第2・第3フレーズへ加える2 frameの安定化休符はWAVから除去されるため、表示時刻へ加算しない。server経路とブラウザ直接経路は同じScore生成・合成計画を使う。

## Codex / GPT-5.6 Sol 利用記録

- 親エージェント: Git基準確認、既存フロー調査、データモデル、335英訳、i18n、カラオケ同期、統合、テスト、ブラウザ確認、VOICEVOX実音声確認、コミット。
- 読み取り専用調査エージェント: Score/frame/phraseRanges/伴奏同期の追跡、英語UI文字列と画像焼込み文字の監査。
- 読み取り専用レビューエージェント: 実装後差分の独立レビュー。
- Codexが加速した部分: 335件対応照合、5曲のframe境界検証、3幅のブラウザ操作、停止・再開時の進捗比較、字幕監査表の自動生成。

## 人間が決めた設計判断

ユーザー指定を正本として、次を維持した。

- 学習者は歌わず、ずんだもんが正解例文を歌う。
- 1プレイ3問、5曲、自作335教材を維持する。
- 日本語のオノマトペと例文を主表示、英語を操作補助と字幕にする。
- 出版社教材由来データを復活させない。
- フレーズ単位の正確な同期を文字単位の推測より優先する。
- C++ / Siv3D版を変更しない。
- push、PR、デプロイは別途明示依頼があるまで行わない。
