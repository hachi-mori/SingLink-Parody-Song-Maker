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

## 自作素材の正本と選定規則

- 正本: ユーザー指定のローカル `オノマトペ.csv`
- 利用許可された範囲: 第3列のオノマトペ文字列のみ。第1・第2列は教材生成に使わない。
- 検査結果: 335行、全行3列、第3列335件、空欄なし、重複なし。
- 採用範囲: 既存の100カード構造を維持するため、CSVの先頭100件を順番どおり採用する。
- 表記: 第3列のカタカナを機械的にひらがなへ変換する。
- 新規作成: 各語につき、語を正確に含む例文1件、簡潔な意味説明1件、例文全体のひらがな読み1件をAIで新規作成する。
- 禁止事項: 第1・第2列、旧カードの例文・意味・派生読みを生成材料として再利用しない。

## 実装方針

1. ユーザー提供の自作100件を、クイズ・表示・意味説明の単一ソースとして格納する。
2. 同じ100件に対応する歌唱用読みを格納し、キー欠落・重複・件数不一致をテストで失敗させる。
3. `parseOnomatopoeiaCardEntries` を通じて、クイズ、正解表示、結果歌詞、スコア生成が同じレコードを参照する現在の構造を維持する。
4. 現教材本文を埋め込んだ固定サンプルとテストを、自作素材または内容に依存しない合成テストデータへ置き換える。
5. 旧 `オノマトペ.csv`、許諾済み `Verb.csv`、オノマトペ以外のクイズ用譜面・伴奏はGit追跡から外すが、gitignore対象としてローカルには残す。
6. クライアントの公開曲一覧はオノマトペだけにする。ローカルサーバーはローカルに残った旧資産を従来どおり列挙できるため、コードとローカル機能は維持する。
7. `copy-assets.mjs` を公開許可リスト方式へ変更し、ローカル専用ファイルがビルド成果物へ混入しないようにする。
8. 5曲 × 100カードのスコア生成構造と、1プレイ3問のランダム出題を維持する。

## 親エージェントが定める完了条件

- 提出対象の追跡ファイルとビルド成果物に、現在の第三者教材由来のカード本文・意味・派生読みが残っていない。
- 自作100件がすべて一意で、例文に正解語を含み、意味と歌唱用読みが欠落していない。
- 採用語が許可済みCSVの第3列先頭100件と一致し、第1・第2列を教材本文へ流用していない。
- クイズ問題、正解表示、結果歌詞、歌唱用読み、5曲のスコア生成が同じ自作レコードを使う。
- 1プレイ3問のランダム出題と5曲選択を維持する。
- `web` で `npm.cmd run test`、`npm.cmd run typecheck`、`npm.cmd run build` が成功する。
- ビルド成果物にも旧教材がないことを確認する。
- Git追跡対象とビルド成果物に `Verb.csv`、旧 `オノマトペ.csv`、オノマトペ以外のクイズ資産がなく、各ファイルはローカルには残っている。
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

なし。ユーザーが第3列の利用、AIによる例文・読み生成、`Verb.csv` の許諾状態、リモートとローカルの分離方針を明示したため実装を開始する。
