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
- VOICEVOX不要の事前生成デモ（自作例文・自作メロディ・英語字幕・カラオケ同期）

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

## 2. 30秒の事前生成デモ

タイトルの `Try fixed quiz demo` を押してください。VOICEVOXの起動やURL設定は不要です。固定順の4問に回答すると、既存の結果画面で次を確認できます。回答内容にかかわらず、固定の全問正解版の歌声を再生します。

- 自作の日本語例文4行と英訳・意味
- 自作メロディ・伴奏と事前生成したずんだもん歌唱
- `Play` / `Pause` / `Sing again` と日本語文字のカラオケ着色
- 「事前生成サンプルであり、通常モードはクイズ回答からリアルタイム生成する」という表示
- `VOICEVOX:ずんだもん` と自作素材のクレジット

直接URLは `http://127.0.0.1:5173/?demo=1` です。このURLでも固定順の問題画面から開始します。デモ結果は生成履歴へ保存しません。

## 3. 5分の通常モード審査経路

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

## 4. VOICEVOXなしの確認

VOICEVOXが起動していなくても、アプリは次の範囲を確認できます。

- タイトルと英語How to
- 5曲選択
- 4問クイズ
- 正誤フィードバック
- 音声なし結果の日本語歌詞、英訳例文、意味

タイトルには未接続の案内が表示されます。4問後は生成をスキップして音声なし結果へ進めます。これはエラーによるクラッシュではなく、実装済みのフォールバックです。歌声・伴奏・再生同期・音声履歴は確認できません。

GitHub Pagesの静的版ではリアルタイム生成を行えませんが、事前生成デモでは歌声・伴奏・再生同期まで確認できます。リアルタイム生成の正式なテスト経路は **ローカルWindows + VOICEVOX** です。

## 5. サンプルデータ

追加のダウンロードは不要です。

- `web/assets/dict/cards_text_data.json`: 日本語教材335件
- `web/assets/dict/cards_singing_readings.json`: 歌唱用読み335件
- `web/assets/dict/cards_english_data.json`: 英訳例文・意味335件
- `web/assets/score/`: 5曲の基礎ScoreとWeb版が使用するVOICEVOXプロジェクト
- `web/assets/inst/`: 5曲の伴奏WAV
- `web/assets/demo/`: 事前生成歌唱WAV、自作伴奏WAV、字幕・同期manifest

問題は毎回ランダムです。特定の語、固定アカウント、固定回答はありません。

## 6. 自動テスト

開発サーバーを終了してから実行して構いません。

```powershell
cd web
npm.cmd run test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run audit:english-subtitles
```

期待値:

- Vitestが9ファイル・37件を成功させる
- 型エラーなし
- `dist/client/` の本番ビルド成功
- `English subtitles: 335/335`
- 監査候補は情報表示であり、欠損・重複・例文不一致ではない

## 7. 停止

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
