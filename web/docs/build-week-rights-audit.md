# OpenAI Build Week 提出向け権利監査

調査日: 2026-07-19

この文書は権利関係を推測せず、リポジトリ内の参照関係と確認状態だけを記録する。

## 教材データと派生データ

| 対象 | 内容・参照状況 | 今回の扱い |
| --- | --- | --- |
| `assets/dict/cards_text_data.json` | 100カード、163例文、163意味。オノマトペクイズの単一入力元 | 自作100件へ必須置換 |
| `assets/dict/cards_singing_readings.json` | 現例文に対応する100件の歌唱用読み | 自作例文対応の読みへ必須置換 |
| `scripts/generate-onomatopoeia-readings.mjs` | 上記JSONからVOICEVOXで読みを生成。現教材の特定例文を固定した上書きあり | 固定本文を除去・自作データへ対応 |
| `shared/src/memorizationScore.ts` | 現教材と一致する固定例文3件をサンプルとして保持 | 自作または非依存の合成データへ置換 |
| `shared/tests/kana.test.ts` | 現教材と一致する例文・意味・読みを固定 | 自作または非依存の合成データへ置換 |
| `assets/dict/オノマトペ.csv` | 現コードから参照なし。ただしビルド時に全assetsがコピーされる | 出典未確認。提出対象から削除候補 |
| `assets/dict/Verb.csv` | 動詞クイズでクライアント・サーバーから実使用 | 出典未確認。確認待ち |

## 参照経路

```text
cards_text_data.json ─┬─> parseOnomatopoeiaCardEntries ─> 3問ランダムクイズ
                      │                                  ├> 正解・意味表示
                      │                                  ├> 結果歌詞
cards_singing_readings.json ┘                            └> 5曲のスコア生成・歌唱

cards_text_data.json ─> generate-onomatopoeia-readings.mjs ─> cards_singing_readings.json
```

クライアント経路は `client/src/lib/staticSongs.ts`、サーバー経路は `server/src/songRepository.ts` で同じ2つのJSONを読む。`shared/src/onomatopoeiaCards.ts` が例文中の正解語を `○○` に置換し、表示文・意味・読みを1レコードへ統合する。

## 提出成果物への混入経路

`scripts/copy-assets.mjs` は `web/assets/` 全体を `web/dist/client/assets/` へ再帰コピーする。したがってコードから未参照の教材ファイルも、削除またはコピー対象制御をしない限り提出成果物へ含まれる。

## 既存構造として維持するもの

- 100カード
- 1プレイ3問のランダム抽出
- クイズ、正解表示、結果歌詞、歌唱用読みの一貫したレコード参照
- 5曲すべてに対する1例文1フレーズのスコア生成

## 主要実装対象外の資産一覧

### 伴奏 11件

- `assets/inst/HappyBirthday.wav`
- `assets/inst/ちょうちょ.wav`
- `assets/inst/むすんでひらいて.wav`
- `assets/inst/オノマトペ.mp3`
- `assets/inst/ハッピーバースデー.mp3`
- `assets/inst/動詞グループ.mp3`
- `assets/inst/呼び込みくん.mp3`
- `assets/inst/呼び込みくんっぽい曲.mp3`
- `assets/inst/大きな古時計.wav`
- `assets/inst/幸せなら手をたたこう.wav`
- `assets/inst/雪.wav`

ユーザーから著作権上問題ない旨の明示があるため、今回は変更しない。

### 楽譜・VOICEVOXプロジェクト 10件

- `assets/score/ちょうちょ.json`
- `assets/score/むすんでひらいて.json`
- `assets/score/オノマトペ.vvproj`
- `assets/score/ハッピーバースデー.vvproj`
- `assets/score/動詞グループ.vvproj`
- `assets/score/呼び込みくん.vvproj`
- `assets/score/呼び込みくんっぽい曲.vvproj`
- `assets/score/大きな古時計.json`
- `assets/score/幸せなら手をたたこう.json`
- `assets/score/雪.json`

ユーザーから著作権上問題ない旨の明示があるため、今回は変更しない。

### 画像・GIF 25件

- `assets/texture/assets/button/` の6件
- `assets/texture/assets/` 直下の19件

今回は変更せず、出典・利用条件は確認待ちとして残す。

### フォント 1件

- `assets/texture/Futehodo-MaruGothic.ttf`

今回は変更せず、ライセンスと再配布条件は確認待ちとして残す。

### VOICEVOX関係

- `assets/score/*.vvproj`
- `scripts/generate-onomatopoeia-readings.mjs` の `audio_query` 利用
- クライアント直接接続とサーバー接続の音声合成処理
- 話者IDとクレジット表示

今回は教材本文の置換に必要な読みデータ以外を主要実装対象にしない。提出前にVOICEVOX利用規約、話者ごとの利用条件、必要なクレジット表記を別途確認する。

## 確認待ち

1. 自作100カードの本文・意味・歌唱用読み。
2. 歌唱用読みをVOICEVOXで自動生成してよいか。
3. `Verb.csv` が自作または利用許諾済みか。
4. 画像・GIF・フォント・VOICEVOXの提出利用条件。
