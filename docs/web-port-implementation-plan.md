# Web版シングリンク 実装設計メモ

最終更新: 2026-06-12

## 1. 目的

既存の Siv3D / C++ 版「シングリンク」と同等の遊び方を、Web アプリとして再実装する。

ただし、既存 Siv3D 版を直接改造するのではなく、今後別リポジトリとして管理できるように `web/` 以下へ独立した Web 版を作成する。既存 C++ 実装は参照のみとし、原則変更しない。

## 2. 完成条件

Web 版の初期完成条件は次の通り。

- タイトル画面を表示できる
- 同梱された `.vvproj` から曲を選択できる
- 既存版に近い流れで歌詞入力、クイズ選択、タイムアップ処理ができる
- ローカル PC の VOICEVOX `http://localhost:50021` に接続確認できる
- VOICEVOX を使って歌声 WAV を生成できる
- 結果画面で伴奏と生成歌声を再生できる
- 生成した WAV をブラウザ内に保存できる
- 生成履歴から再生、削除、ダウンロードできる
- 歌詞、入力内容、曲名、生成日時を履歴に残せる
- PC / タブレット / スマホ幅で UI が破綻しない
- VOICEVOX 未起動、合成失敗、曲未選択、音声再生失敗などの失敗表示がある
- 起動手順、VOICEVOX 前提、既知制限を README に記載する
- Web 版について `typecheck`、テスト、実画面操作確認を可能な限り行う

長時間同じ問題で止まり続ける場合は、原因と妥協点を記録したうえで、完成に必要な別作業へ進む。

## 3. 非目標

初期実装では次を目標にしない。

- 既存 Siv3D 版の Visual Studio ビルド確認
- ユーザー管理
- サーバー DB
- クラウド保存
- スマホ端末単体でのローカル VOICEVOX 合成保証
- 公開 Web サービスとしての完全運用

将来公開を意識した設計にはするが、初期版はローカル起動を主対象とする。

## 4. 推奨ディレクトリ構成

```text
SingLink-Parody-Song-Maker/
├─ ずんだもんアイドルPJ/      # 既存 Siv3D 版。参照のみ
├─ docs/
│  └─ web-port-implementation-plan.md
└─ web/                       # 新 Web 版
   ├─ client/                 # React + TypeScript + Vite
   ├─ server/                 # Node.js + TypeScript + Fastify
   ├─ shared/                 # 共通型、vvproj処理、歌詞ロジック
   ├─ assets/                 # 手動コピーした同梱素材
   │  ├─ texture/
   │  ├─ inst/
   │  ├─ score/
   │  └─ dict/
   ├─ tmp/                    # サーバー側の一時ファイル
   ├─ package.json
   └─ README.md
```

`web/` は将来切り出せるよう、Web 版に必要な設定、依存関係、README を閉じ込める。

## 5. 技術構成

- client: TypeScript + React + Vite
- server: Node.js + TypeScript + Fastify
- shared: TypeScript の共通モジュール
- storage: ブラウザ標準の IndexedDB
- target browser: Chrome / Edge 優先

追加ライブラリは品質向上に必要であれば導入してよい。候補は次の通り。

- Vitest: shared ロジックのテスト
- Playwright: 実画面操作確認
- idb: IndexedDB 操作の薄いラッパー
- zod: API 入出力や設定値の検証
- concurrently / npm-run-all: client / server の同時起動

## 6. 素材とファイル方針

`.vvproj`、伴奏音源、辞書 CSV、画像、GIF は Web 版に同梱する。

素材コピーは自動同期ではなく、手動コピーを前提とする。Web 版では `web/assets/` 配下に置く。

生成 WAV はサーバー DB には保存しない。合成時のサーバー側一時ファイルは、フロントへ返したあと削除できる設計にする。

フロント側では IndexedDB に次の情報を保存する。

- WAV Blob
- 曲名
- 生成日時
- ファイル名
- 表示用歌詞
- 入力内容
- 使用した VOICEVOX 接続先

ファイル名はおすすめ形式として次を使う。

```text
シングリンク_<曲名>_<YYYYMMDD-HHmmss>.wav
```

例:

```text
シングリンク_オノマトペ_20260612-213000.wav
```

## 7. VOICEVOX 接続方針

初期値は `http://localhost:50021` とする。

ただし将来別 URL を使えるよう、サーバー設定で差し替え可能にする。

想定する設定:

```text
VOICEVOX_BASE_URL=http://localhost:50021
```

フロントから VOICEVOX へ直接アクセスするのではなく、基本的には Web サーバーが代理でアクセスする。

理由:

- CORS 問題を避けやすい
- 将来の接続先変更をまとめやすい
- `.vvproj` 変換や一時ファイル処理をサーバー側に寄せられる

## 8. API 設計案

```text
GET  /api/health
GET  /api/voicevox/version
GET  /api/songs
GET  /api/songs/:songId
POST /api/parody/preview
POST /api/synthesis
```

### GET /api/health

Web サーバーの起動確認。

### GET /api/voicevox/version

VOICEVOX の接続確認。接続できない場合も、フロントで分かりやすく表示できるレスポンスにする。

### GET /api/songs

`web/assets/score/*.vvproj` から曲一覧を返す。

返却例:

```json
[
  {
    "id": "onomatopoeia",
    "title": "オノマトペ",
    "vvprojPath": "assets/score/オノマトペ.vvproj",
    "instPath": "assets/inst/オノマトペ.mp3"
  }
]
```

### GET /api/songs/:songId

曲の詳細、問題数、表示に必要なメタデータを返す。

### POST /api/parody/preview

入力済みタスクから結果表示用歌詞を生成する。

### POST /api/synthesis

歌詞差し替え、score JSON 変換、VOICEVOX 合成、WAV 返却を行う。

レスポンスは WAV を Blob として扱える形式にする。必要に応じて JSON メタデータと音声 URL の組み合わせでもよい。

## 9. 共有ロジック移植対象

UI へ直書きせず、`web/shared/` に純粋関数中心で移植する。

優先して移植する関数:

- `ExtractTalkUtterances`
- `ParseTargetText`
- `BuildTalkProblems`
- `splitSyllables`
- `splitOnomatopoeiaMoras`
- `getVowel`
- `replaceChoonWithVowel`
- `isHiraganaOnly`
- `ApplyParodyLyrics`
- `BuildResultDisplayLyrics`
- `ExtractSongLyrics`
- `GetVVProjTrackName`
- `ConvertVVProjToScoreJSON`
- `TransposeScoreJSON`

VOICEVOX 合成部分は TypeScript / Node.js の HTTP 処理として再設計する。

## 10. フロント画面構成

画面は既存 Scene に対応させる。

```text
Title
WriteLyrics
VocalSynthesis
Result
History
Story
HowToPlay
Credit
```

`History` は Web 版で追加する。生成済み WAV の一覧、再生、削除、ダウンロードを担当する。

共有状態には次を持つ。

- 選択中の曲
- VOICEVOX 接続状態
- 入力済みタスク
- 生成済み歌詞
- 直近の生成 WAV
- エラー状態

## 11. レスポンシブ UI 方針

Siv3D 版の 1920x1080 固定座標をそのまま再現しない。Web では動的な UI を優先する。

- 背景画像 / GIF は比率を崩さず `object-fit: cover` または `contain` で扱う
- ロゴは中央基準で配置し、画面幅に応じて `max-width` を変える
- ボタンは固定座標ではなく flex / grid で配置する
- 入力欄と選択肢はタッチ操作しやすい大きさにする
- 結果歌詞は画面幅に応じて折り返す
- PC、タブレット、スマホの幅で主要操作が続けられるようにする
- スマホは UI 表示対応を目標とし、合成は PC ローカル VOICEVOX 推奨と明示する

UX 文言は既存版に寄せつつ、Web 上で分かりやすくなる軽い表現変更は許可する。

## 12. 失敗時表示

最低限、次の失敗表示を用意する。

- VOICEVOX 未起動または接続失敗
- VOICEVOX バージョン取得失敗
- 曲未選択
- `.vvproj` 読み込み失敗
- 辞書 CSV 読み込み失敗
- 入力文字種エラー
- 音節数エラー
- 合成失敗
- 音声再生失敗
- IndexedDB 保存失敗

失敗時には、ユーザーが次に何をすればよいか分かる文言を表示する。

## 13. 段階実装計画

### Phase 1: 調査と設計固定

- 既存 C++ 実装と docs を読む
- 移植対象関数と画面を整理する
- `web/README.md` と必要なら `web/docs/architecture.md` に設計を記録する

### Phase 2: Web 作業領域作成

- `web/` 以下に client / server / shared 構成を作る
- TypeScript、Vite、Fastify、Vitest を設定する
- client / server を同時起動できる npm script を用意する

### Phase 3: 素材配置

- 手動コピー前提の配置先を作る
- `.vvproj`、伴奏、辞書、画像、GIF を読み込めるパス設計にする
- README にコピー元とコピー先を明記する

### Phase 4: shared ロジック移植

- `SolvedTask`、`TalkProblem`、`SongInfo` などの型を定義する
- vvproj 読み込み、talk 抽出、問題生成を移植する
- 歌詞差し替え、結果歌詞生成を移植する
- Vitest で代表ケースをテストする

### Phase 5: バックエンド実装

- `/api/health`
- `/api/voicevox/version`
- `/api/songs`
- `/api/songs/:songId`
- `/api/parody/preview`
- `/api/synthesis`

を実装する。

VOICEVOX 未起動時でもサーバー自体は落ちないようにする。

### Phase 6: フロントエンド実装

- Title 画面
- WriteLyrics 画面
- VocalSynthesis 画面
- Result 画面
- History 画面
- Story / HowToPlay / Credit 画面

を実装する。

まず動線を通し、その後に画像、GIF、フォント、細かい文言を整える。

### Phase 7: IndexedDB 保存

- 生成 WAV Blob を保存する
- 曲名、生成日時、ファイル名、歌詞、入力内容を保存する
- 履歴から再生、削除、ダウンロードできるようにする

### Phase 8: 実画面確認

- dev server を起動する
- 実際にブラウザで画面を操作する
- 曲選択、歌詞入力、合成、結果再生、履歴保存、DL を確認する
- desktop / tablet / mobile 幅のスクリーンショットを確認する
- レイアウト崩れ、画像比率、入力欄、ボタンサイズを調整する

### Phase 9: ドキュメント整備

- 起動手順
- VOICEVOX 起動前提
- 素材コピー手順
- 生成履歴の保存場所
- 対応ブラウザ
- 既知制限
- トラブルシュート

を README に記載する。

## 14. 確認コマンド方針

Siv3D 版の Visual Studio ビルド確認は行わない。

Web 版では次を確認する。

```text
npm run typecheck
npm run test
npm run dev
```

可能であれば Playwright または Codex Browser で実画面操作も行う。

VOICEVOX が起動していない環境では、VOICEVOX 未接続時のエラー表示までを確認し、合成成功確認は未実施として記録する。

## 15. コミット方針

変更後は `git status` を確認する。

既存 C++ 版や素材にユーザーの未コミット変更がある場合、それらを巻き込まない。

コミットメッセージは日本語中心にする。

例:

```text
Web版移植の設計メモを追加
```

## 16. 実装開始時の注意

実装開始時は、この設計メモを前提として進める。

ただし実装中に Web の制約や VOICEVOX API の挙動差で詰まる場合は、既存動作を優先しつつ、Web に合わせた設計変更を行ってよい。その場合は README または設計メモに理由を残す。
