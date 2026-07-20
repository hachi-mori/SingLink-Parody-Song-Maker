# OpenAI Build Week 提出向け権利監査

調査日: 2026-07-19

この文書は権利関係を推測せず、リポジトリ内の参照関係と確認状態だけを記録する。

## 教材データと派生データ

| 対象 | 内容・参照状況 | 今回の扱い |
| --- | --- | --- |
| `assets/dict/cards_text_data.json` | 作業開始時は第三者教材由来の100カード、163例文、163意味。オノマトペクイズの単一入力元 | 自作335件へ置換済み |
| `assets/dict/cards_singing_readings.json` | 作業開始時は第三者教材由来の例文に対応する100件の歌唱用読み | 自作335件の例文対応の読みへ置換済み |
| `scripts/generate-onomatopoeia-readings.mjs` | 上記JSONからVOICEVOXで読みを生成。現教材の特定例文を固定した上書きあり | 固定本文を除去・自作データへ対応 |
| `shared/src/memorizationScore.ts` | 現教材と一致する固定例文3件をサンプルとして保持 | 自作または非依存の合成データへ置換 |
| `shared/tests/kana.test.ts` | 現教材と一致する例文・意味・読みを固定 | 自作または非依存の合成データへ置換 |
| `assets/dict/オノマトペ.csv` | 現コードから参照なし。第3列のみ利用可とユーザー確認済み | 第3列全335件を新教材の語彙入力に使い、CSV自体はGit追跡から除外 |
| `assets/dict/Verb.csv` | 動詞クイズでクライアント・サーバーから実使用。許諾済み | 公開版から除外し、ローカルファイルとコードは維持 |

## 参照経路

```text
cards_text_data.json ─┬─> parseOnomatopoeiaCardEntries ─> 4問ランダムクイズ
                      │                                  ├> 正解・意味表示
                      │                                  ├> 結果歌詞
cards_singing_readings.json ┘                            └> 5曲のスコア生成・歌唱

cards_text_data.json ─> generate-onomatopoeia-readings.mjs ─> cards_singing_readings.json
```

クライアント経路は `client/src/lib/staticSongs.ts`、サーバー経路は `server/src/songRepository.ts` で同じ2つのJSONを読む。`shared/src/onomatopoeiaCards.ts` が例文中の正解語を `○○` に置換し、表示文・意味・読みを1レコードへ統合する。

## 提出成果物への混入経路

現状の `scripts/copy-assets.mjs` は `web/assets/` 全体を再帰コピーする。実装では公開許可リスト方式へ変更し、Git追跡から外してローカルに残す教材・旧クイズ資産が成果物へ混入しないようにする。

## 既存構造として維持するもの

- 335カード
- 1プレイ4問のランダム抽出
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

2026-07-20追補: 全25件をRyotsu制作と確認した。所有者はSingLink公開・Build Week提出用途の許諾根拠を非公開保管し、公開要約を `docs/permissions/ryotsu-assets.md` に記録した。画像はMIT対象外とする。

### フォント 1件

- `assets/texture/Futehodo-MaruGothic.ttf`

2026-07-20追補: 公式配布元を確認し、SIL Open Font License 1.1全文を `assets/texture/OFL.txt` に配置した。追跡TTFはVersion 1.000のまま維持し、ローカル保管のVersion 1.03とは別hashであることを台帳化した。

### VOICEVOX関係

- `assets/score/*.vvproj`
- `scripts/generate-onomatopoeia-readings.mjs` の `audio_query` 利用
- クライアント直接接続とサーバー接続の音声合成処理
- 話者IDとクレジット表示

今回は教材本文の置換に必要な読みデータ以外を主要実装対象にしない。2026-07-20にVOICEVOXとずんだもん音源の公式条件を再確認し、必要表記を **`VOICEVOX:ずんだもん`** へ統一した。

## 自作教材の生成規則

1. ユーザー指定CSVの第3列だけを読み、全335件を順番どおり採用する。
2. カタカナ表記を機械的にひらがな化する。
3. 各語について例文1件、意味説明1件、歌唱用ひらがな読み1件を新規作成する。
4. 第1・第2列と旧カード本文は生成材料として使わない。
5. 旧本文との完全一致、語の欠落、重複、読みの文字種をテスト・監査する。

## 2026-07-19時点の確認待ち（2026-07-20解消）

- 画像・GIF・フォント・VOICEVOXの提出利用条件は、2026-07-20の所有者確認と公式条件確認で解消した。
- 公開対象の5曲のScore・伴奏はhachi-mori本人が制作し、演奏/打ち込み・書き出しを行ったと確認した。
- コードはMIT License、Copyright © 2025–2026 hachi-moriとし、個別素材を `LICENSE_SCOPE.md` で分離した。

提出時点の素材別判定は [`docs/asset-inventory.md`](../../docs/asset-inventory.md)、配布物に含める表示は [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md)、提出者が行う最終判断は [`docs/submission-owner-checklist.md`](../../docs/submission-owner-checklist.md) を正本とする。

## 実施結果

- 第3列全335件から新規例文・意味・歌唱用読みを作成した。先に動作確認済みだった先頭100件は内容を維持し、残り235件を追加した。
- 旧教材の例文・意味・歌唱用読みとの完全一致は、現在の追跡対象で0件だった。
- `Verb.csv`、旧 `オノマトペ.csv`、非オノマトペの旧クイズ資産12件は、ローカルに残したままGit追跡から除外した。
- 公開ビルド成果物では、上記12資産の混入が0件であることを確認した。
- 335カード × 5曲のスコア生成と、各対応フレーズへの正解語モーラ割当をテストした。
