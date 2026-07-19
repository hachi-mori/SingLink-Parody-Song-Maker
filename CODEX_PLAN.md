# OpenAI Build Week 自作教材置換計画

最終更新: 2026-07-19

## 目標

最新の `origin/openai-build-week` を基点に、Web版へ含まれる第三者教材由来のカード文章・例文・意味データと、その派生読みを、ユーザー提供の自作教材だけに置き換える。C++ / Siv3D版は変更しない。

## 作業ブランチと基点

- 作業ブランチ: `codex/build-week-original-content`
- 基点: `origin/openai-build-week` の `f7da284`
- 基点との差分: 作業開始時点ではなし

## 変更可能範囲

- `web/assets/dict/`
- `web/shared/src/`
- `web/shared/tests/`
- `web/scripts/`
- 必要最小限の `web/client/` と `web/server/`
- `web/docs/`
- `CODEX_PLAN.md`、`CODEX_STATUS.md`、`BACKLOG.md`、`BLOCKERS.md`

## 変更しない範囲

- C++ / Siv3D版一式
- Visual Studioのソリューション・プロジェクト設定
- `web/assets/inst/` の伴奏
- `web/assets/score/` の楽譜・VOICEVOXプロジェクト
- 今回の目的に関係しない画像、フォント、VOICEVOX実装
- 依存関係と `package-lock.json`

## 調査結果と置換対象

詳細は `web/docs/build-week-rights-audit.md` に記録する。

### 必須置換・除去

1. `web/assets/dict/cards_text_data.json`: 100カード、163例文、163意味を含む現在の教材本体。
2. `web/assets/dict/cards_singing_readings.json`: 現在の例文から生成された100件の歌唱用読み。
3. `web/scripts/generate-onomatopoeia-readings.mjs`: 現教材の特定例文を固定した `readingOverrides` を含む。
4. `web/shared/src/memorizationScore.ts`: 現教材と一致する固定例文を3件含む。
5. `web/shared/tests/kana.test.ts`: 現教材と一致する固定例文・意味・読みを含む。
6. `web/assets/dict/オノマトペ.csv`: 未参照だがビルド成果物へコピーされる。出典未確認のため削除候補。

### 確認待ち

- `web/assets/dict/Verb.csv`: 動詞クイズで実使用され、提出成果物へ含まれる。ユーザー提供素材か確認できないため、利用可とは判断しない。
- `web/assets/texture/` の画像・GIF 25件とフォント1件: 今回は一覧化のみ。出典・利用条件の確認待ち。
- VOICEVOXで生成・利用する音声、話者、クレジット表記: 今回は一覧化のみ。提出条件の確認待ち。

### ユーザー確認済みで今回扱わないもの

- `web/assets/inst/` の伴奏11件
- `web/assets/score/` の楽譜・VOICEVOXプロジェクト10件

## 必要な自作素材

100件を維持する場合、各カードについて次が必要。

- 一意なオノマトペ
- そのオノマトペ文字列を1回以上含む自作例文
- 自作の意味説明
- 例文全体の歌唱用読み（ひらがなのみ）、または自作例文からVOICEVOXで機械生成することへの明示的な許可

受領形式は現在のJSONに合わせても、CSV等から変換してもよい。ただし素材本文はユーザーが提供したものだけを使う。

## 実装方針

1. ユーザー提供の自作100件を、クイズ・表示・意味説明の単一ソースとして格納する。
2. 同じ100件に対応する歌唱用読みを格納し、キー欠落・重複・件数不一致をテストで失敗させる。
3. `parseOnomatopoeiaCardEntries` を通じて、クイズ、正解表示、結果歌詞、スコア生成が同じレコードを参照する現在の構造を維持する。
4. 現教材本文を埋め込んだ固定サンプルとテストを、自作素材または内容に依存しない合成テストデータへ置き換える。
5. 未参照の旧 `オノマトペ.csv` を提出対象から除去する。
6. `Verb.csv` は権利確認結果に応じて維持、置換、または動詞クイズごと提出対象から外す。推測では決めない。
7. 5曲 × 100カードのスコア生成構造と、1プレイ3問のランダム出題を維持する。

## 親エージェントが定める完了条件

- 提出対象の追跡ファイルとビルド成果物に、現在の第三者教材由来のカード本文・意味・派生読みが残っていない。
- 自作100件がすべて一意で、例文に正解語を含み、意味と歌唱用読みが欠落していない。
- クイズ問題、正解表示、結果歌詞、歌唱用読み、5曲のスコア生成が同じ自作レコードを使う。
- 1プレイ3問のランダム出題と5曲選択を維持する。
- `web` で `npm.cmd run test`、`npm.cmd run typecheck`、`npm.cmd run build` が成功する。
- ビルド成果物にも旧教材がないことを確認する。
- `git diff --check` が成功し、日本語の文字化けがない。
- C++ / Siv3D版に差分がなく、Visual Studioビルドを実行していない。
- 実装を日本語のコミットメッセージでコミットする。

## エージェント分担

- 親（5.6 Sol）: 権利上の境界、変更方針、完了条件、最終レビュー、コミット判断。
- Terra子エージェント: 自作素材受領後の限定的なデータ置換、固定サンプル修正、Webテスト実行。
- 同じ変更範囲へ書き込む実装役は1体だけにする。

## 確認コマンド

```powershell
cd web
npm.cmd run test
npm.cmd run typecheck
npm.cmd run build

cd ..
git diff --check
git status --short
git diff --name-only origin/openai-build-week...HEAD
```

Visual StudioおよびC++版のビルドは実行しない。

## 現在の停止条件

自作カード本文・意味・歌唱用読みが未提供のため、教材本文の置換実装は開始しない。`BLOCKERS.md` の判断事項が解消された後に、上記範囲で実装を再開する。
