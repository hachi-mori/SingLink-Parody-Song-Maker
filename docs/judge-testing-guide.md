# OpenAI Build Week 審査員向け実行手順

更新日: 2026-07-19

この文書は、Windows上でSingLink Web版を最短で確認するための手順です。コピー&ペーストで実行できます。

## 確認できること

- 英語初期UIと英語・日本語切替
- 335件からランダムに出る4問のオノマトペクイズ
- 5曲の選択
- 正しい日本語例文4行と英訳・意味
- Score由来のカラオケ着色
- ローカルVOICEVOXによるずんだもんの歌声
- IndexedDBへ保存される生成履歴

## 必要環境

- Windows
- ChromeまたはEdge
- Node.js `^20.19.0` または `>=22.12.0`（Node.js 22推奨）
- npm
- 歌声を確認する場合は [VOICEVOX](https://voicevox.hiroshiba.jp/)

動作確認済みのVOICEVOXは0.25.1です。認証情報、APIキー、デモアカウント、`.env` は不要です。

## 1. 起動

```powershell
git clone https://github.com/hachi-mori/Tohoku-procon2025.git
cd Tohoku-procon2025
git switch openai-build-week
cd web
npm ci
```

歌声も確認する場合は、VOICEVOXを起動してから次を実行します。

```powershell
npm.cmd run dev
```

次を開きます。

```text
http://127.0.0.1:5173/
```

使用ポート:

| 用途 | URL |
| --- | --- |
| Webクライアント | `http://127.0.0.1:5173/` |
| Fastify API | `http://127.0.0.1:5174/` |
| VOICEVOX初期値 | `http://localhost:50021/` |

サーバーのVOICEVOX接続先を変える場合だけ、起動前に設定します。

```powershell
$env:VOICEVOX_BASE_URL = "http://localhost:50021"
npm.cmd run dev
```

## 2. 5分の審査経路

1. タイトルが英語で表示され、`Language` が `English` であることを確認します。
2. `How to play` を開き、4つの英語ステップを確認してタイトルへ戻ります。
3. クイズはオノマトペを選び、元曲は次の5曲から1曲を選びます。
   - Butterfly (`ちょうちょ`)
   - Close and Open (`むすんでひらいて`)
   - My Grandfather's Clock (`大きな古時計`)
   - If You're Happy and You Know It (`幸せなら手をたたこう`)
   - Snow (`雪`)
4. `Start` を押し、4問に答えます。各問題は日本語例文の `○○` に入る語を3択から選びます。正解・誤答のどちらでも次へ進めます。
5. 4問後、VOICEVOX接続時は4つの正解例文の歌声を生成します。
6. 結果画面で次を確認します。
   - 日本語の正解例文が4行ある
   - 各行の下に英訳例文と英語意味がある
   - 誤答した行だけ `Not quite` が表示される
   - `Play` で歌声と伴奏が始まり、日本語の文字が順に着色される
   - `Pause` と再開で着色位置も停止・再開する
7. 音声生成後はタイトルの `Saved songs` を開き、ブラウザ内の履歴を確認します。

日本語表示の差分を確認する場合は、タイトルで `Language` を `日本語` に変更します。日本語結果では英訳例文と英語意味を表示しません。

## 3. VOICEVOXなしの確認

VOICEVOXが起動していなくても、アプリは次の範囲を確認できます。

- タイトルと英語How to
- 5曲選択
- 4問クイズ
- 正誤フィードバック
- 音声なし結果の日本語歌詞、英訳例文、意味

タイトルには未接続の案内が表示されます。4問後は生成をスキップして音声なし結果へ進めます。これはエラーによるクラッシュではなく、実装済みのフォールバックです。歌声・伴奏・再生同期・音声履歴は確認できません。

GitHub Pagesの静的版も同じ理由で完全な歌声生成を行えません。**ローカルWindows + VOICEVOXが正式なフルテスト経路です。**

## 4. サンプルデータ

追加のダウンロードは不要です。

- `web/assets/dict/cards_text_data.json`: 日本語教材335件
- `web/assets/dict/cards_singing_readings.json`: 歌唱用読み335件
- `web/assets/dict/cards_english_data.json`: 英訳例文・意味335件
- `web/assets/score/`: 5曲の基礎ScoreとWeb版が使用するVOICEVOXプロジェクト
- `web/assets/inst/`: 5曲の伴奏WAV

問題は毎回ランダムです。特定の語、固定アカウント、固定回答はありません。

## 5. 自動テスト

開発サーバーを終了してから実行して構いません。

```powershell
cd web
npm.cmd run test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run audit:english-subtitles
```

期待値:

- Vitestが7ファイル・33件を成功させる
- 型エラーなし
- `dist/client/` の本番ビルド成功
- `English subtitles: 335/335`
- 監査候補は情報表示であり、欠損・重複・例文不一致ではない

## 6. 停止

`npm.cmd run dev` を実行したPowerShellで `Ctrl+C` を押します。VOICEVOXも通常どおり終了できます。

## トラブルシューティング

| 症状 | 確認 |
| --- | --- |
| `npm ci` がNode.js要件で失敗 | `node --version` が `^20.19.0` または `>=22.12.0` か確認 |
| 5173または5174が使用中 | 既に起動している `npm.cmd run dev` を終了 |
| VOICEVOX未接続 | VOICEVOXを起動し、URLが `http://localhost:50021` か確認して `Recheck` |
| 歌声が生成されない | GitHub Pagesではなくローカル起動か確認 |
| 保存履歴がない | 音声なし結果ではなく、VOICEVOXで音声を生成したか確認 |
| 言語が日本語で始まる | 過去の選択が `localStorage` に保存済み。タイトルでEnglishへ戻すかサイトデータを消去 |

## 審査対象の境界

- 主対象は `web/` 以下のWeb版です。
- C++ / Siv3D版は既存プロジェクトであり、Build Week期間中の主要実装ではありません。
- 実行時にOpenAI APIは使用しません。Codex / GPT-5.6は開発工程で使用しました。
- 素材の権利証拠状況は [第三者素材一覧](../THIRD_PARTY_NOTICES.md) と [素材台帳](asset-inventory.md) に明示しています。
