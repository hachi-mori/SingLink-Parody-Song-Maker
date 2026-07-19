# SingLink Web 開発・ローカル実行ガイド

ルートの [English README](../README.md) はOpenAI Build Week提出向けの概要です。この文書は、Web版を実装・検証する開発者向けです。

既存のC++ / Siv3D版を参照して構築した独立Web版で、Build Weekの主な審査対象は `web/` 以下です。C++版はWeb版のビルド・実行に使いません。

## 必要環境

- Windows
- Node.js `^20.19.0` または `>=22.12.0`（Vite 8の要件。Node.js 22推奨）
- npm
- ChromeまたはEdge
- 歌声合成を確認する場合はローカル [VOICEVOX](https://voicevox.hiroshiba.jp/)

VOICEVOX 0.25.1で実音声確認済みです。アプリ実行にOpenAI APIキー、デモアカウント、`.env` は不要です。

タイトルの「すぐにデモを見る」は、事前生成したずんだもん歌唱、自作メロディ・伴奏、自作例文4件を既存結果画面で再生します。実行時のVOICEVOX接続は不要です。`http://127.0.0.1:5173/?demo=1` で結果へ直接移動できます。画面には、通常モードがクイズ回答からリアルタイム生成することとの違いを明記しています。

## インストールと起動

リポジトリルートから:

```powershell
cd web
npm ci
npm.cmd run dev
```

次を開きます。

```text
http://127.0.0.1:5173/
```

`npm.cmd run dev` はFastifyとViteを同時に起動します。

| サービス | URL |
| --- | --- |
| Vite client | `http://127.0.0.1:5173/` |
| Fastify server | `http://127.0.0.1:5174/` |
| VOICEVOX default | `http://localhost:50021/` |

VOICEVOX接続先をサーバー側で上書きする場合:

```powershell
$env:VOICEVOX_BASE_URL = "http://localhost:50021"
npm.cmd run dev
```

タイトル画面のURL欄からも接続先を変更できます。

## 構成

```text
web/
├─ client/                 React / Vite UI
├─ server/                 Fastify APIとVOICEVOX代理接続
├─ shared/                 教材、かな・モーラ、Score、WAV、型
├─ scripts/                アセットコピー、読み生成、英語字幕監査
├─ assets/
│  ├─ demo/                事前生成歌唱、自作伴奏、字幕・同期manifest
│  ├─ dict/                335件の日本語・読み・英語教材
│  ├─ inst/                5曲の伴奏WAV
│  ├─ score/               5曲の基礎Scoreとvvproj
│  └─ texture/             UI画像・GIF・フォント
└─ dist/client/            本番ビルド出力
```

### 実行経路

通常の開発経路:

```text
Browser :5173 -> /api proxy -> Fastify :5174 -> VOICEVOX :50021
```

事前生成デモ経路:

```text
Browser :5173 -> /assets/demo（VOICEVOXへの実行時通信なし）
```

静的配置向けにブラウザからVOICEVOXへ直接接続するコードもあります。両経路は `createMemorizationScore` と `buildMemorizationSynthesisPlan` を共有します。GitHub Pagesだけではリアルタイム生成を保証できませんが、事前生成デモはVOICEVOXなしで再生できます。リアルタイム生成の正式な審査経路はFastifyとVOICEVOXを含むローカル起動です。

## 教材

- `assets/dict/cards_text_data.json`: 所有者提供の語彙順と、新規作成した335件の問題・例文・意味
- `assets/dict/cards_singing_readings.json`: 335件の歌唱用ひらがな読み
- `assets/dict/cards_english_data.json`: 335件の英訳例文・英語意味

3ファイルはオノマトペをキーに結合し、英語データは日本語例文の完全一致も確認します。クイズは毎回4件をランダム抽出します。

英語字幕の監査:

```powershell
npm.cmd run audit:english-subtitles
node scripts/audit-english-subtitles.mjs --all
```

前者は件数と要レビュー項目、後者は全335件のMarkdown表を標準出力へ出します。

## Scoreとカラオケ同期

1. `shared/src/memorizationSongs.ts` の5曲から基礎Scoreを選ぶ。
2. `createMemorizationScore` が4例文を割り当て、4つの `phraseRanges` を返す。
3. `buildKaraokeLineTimings` が各音符の `frame_length` を93.75 fpsで秒へ変換する。
4. 休符中は文字位置を保ち、歌唱音符の区間だけ日本語文字の着色を進める。
5. 結果画面は `AudioContext.currentTime` と再生オフセットから位置を更新し、歌声と伴奏を同時に開始する。

第2〜第4フレーズの安定化用2 frame休符は合成WAVから除去されるため、表示時刻へ二重加算しません。

## 言語

- 保存済み言語が `ja` の場合だけ日本語で開始し、それ以外は英語で開始する。
- 選択は `localStorage` の `singlink.language` に保存する。
- 英語モードは英訳例文・英語意味を表示する。
- 日本語モードは英語の学習補助を表示しない。
- 英語の「あそびかた」はHTMLの4ステップ、日本語は既存画像を表示する。

ブラウザ言語を自動判定する実装ではありません。

## 生成履歴

生成したWAVと次のメタデータをブラウザのIndexedDBへ保存します。

- 曲名と生成日時
- ファイル名
- 表示歌詞と回答
- VOICEVOX接続先

履歴画面から再生、削除、ダウンロードできます。サーバーDBやクラウド同期はありません。サイトデータを消すと履歴も消えます。

## npm scripts

| コマンド | 内容 |
| --- | --- |
| `npm.cmd run dev` | clientとserverを同時起動 |
| `npm.cmd run dev:client` | Viteだけ起動 |
| `npm.cmd run dev:server` | Fastifyだけwatch起動 |
| `npm.cmd run start:server` | Fastifyをwatchなしで起動 |
| `npm.cmd run test` | Vitest全件 |
| `npm.cmd run typecheck` | TypeScript型チェック |
| `npm.cmd run build` | 型チェック、Vite build、公開許可リストのアセットコピー |
| `npm.cmd run audit:english-subtitles` | 335件の英語字幕監査 |
| `npm.cmd run generate:demo-assets` | ローカルVOICEVOXからデモ歌唱WAV、自作伴奏、同期manifestを再生成 |
| `npm.cmd run generate:onomatopoeia-readings` | ローカルVOICEVOXを使う読みデータ再生成 |

`generate:onomatopoeia-readings` と `generate:demo-assets` は成果物の通常起動には不要です。実行すると追跡対象アセットへ影響するため、変更目的がありVOICEVOX 0.25.1を起動している場合だけ使います。

## 検証

```powershell
npm.cmd run test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run audit:english-subtitles
```

Build Week提出版の確認範囲:

- 335教材・英語字幕・歌唱用読みの対応
- 335教材×5曲のScore生成
- 4問・4フレーズ・音符/休符タイミング
- server/direct両VOICEVOX経路の共通計画
- WAV休符除去
- 保存値なしの英語開始と保存済み `en` / `ja`
- 1280×720、820×1180、390×844の実ブラウザ表示
- 事前生成デモは1440×900、768×1024、375×812でも横スクロールなし
- VOICEVOX 0.25.1の4文実音声

審査用の具体的な操作は [judge-testing-guide.md](../docs/judge-testing-guide.md) を参照してください。

## 本番アセット

`scripts/copy-assets.mjs` は `web/assets/` 全体ではなく、コードに列挙した公開許可リストだけを `dist/client/assets/` へコピーします。ただし `texture/` はディレクトリ単位なので、画像・GIF・フォントをすべて含みます。

第三者素材の出典・許諾証拠には未解決項目があります。公開・再配布前に [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)、[asset-inventory.md](../docs/asset-inventory.md)、[submission-owner-checklist.md](../docs/submission-owner-checklist.md) を確認してください。

## GitHub Pages

静的UI、教材、曲選択、クイズ、音声なし結果、事前生成デモを配信できます。Fastifyは動かず、ブラウザからローカルVOICEVOXへの接続も環境依存のため、Pages単体ではリアルタイム生成を提供しません。`web/dist/client/` が静的配置対象です。

## クレジット

- プログラム: はちもり
- デザイン: りょつ
- 歌声: **VOICEVOX:ずんだもん**

VOICEVOX本体はリポジトリへ同梱していません。
