# SingLink（シングリンク）

**カラオケ文化をヒントにした日本語学習Webアプリです。4問のオノマトペクイズに答えると、ずんだもんが正しい日本語例文を歌い、歌声に合わせて歌詞が光ります。英語モードでは英訳と意味も確認できます。**

[English README](README.md) · [紹介動画](https://youtu.be/B1NkSrOzdA8) · [審査員向け最短手順](docs/judge-testing-guide.md) · [Build Week開発記録](docs/build-week-development.md) · [第三者素材一覧](THIRD_PARTY_NOTICES.md)

## 公開デモ（準備不要）

[GitHub Pagesで固定4問デモを開始する](https://hachi-mori.github.io/SingLink-Parody-Song-Maker/openai-build-week/?demo=1)。ローカルサーバーやVOICEVOXを起動せず、固定4問の問題画面から始まります。回答後は、同梱済みのずんだもん歌唱・伴奏・カラオケ着色を再生できます。タイトルの[Build Week公開URL](https://hachi-mori.github.io/SingLink-Parody-Song-Maker/openai-build-week/)からも「固定問題デモを遊ぶ」を選べます。

これは再現可能な提示用経路です。入力内容に応じて新しい歌声を作る機能ではなく、同じ事前生成サンプルを再生します。回答に基づくリアルタイム歌声の確認は、下記のWindowsローカル版とVOICEVOXで行います。

## OpenAI Build Week紹介動画

[![OpenAI Build Week紹介動画のサムネイル](docs/images/build-week/openai-build-week-thumbnail.png)](https://youtu.be/B1NkSrOzdA8)

[2分47秒のOpenAI Build Week紹介動画をYouTubeで見る](https://youtu.be/B1NkSrOzdA8)。英語Web版、固定公開デモ、カラオケ再生、335件の教材整備、Codex / GPT-5.6を使った開発工程を紹介しています。

## スクリーンショット

| 英語のあそびかた | 4問クイズ | カラオケ結果 |
| --- | --- | --- |
| ![英語4ステップのあそびかた](docs/images/build-week/how-to-en.png) | ![英語クイズ画面](docs/images/build-week/quiz-en.png) | ![日本語歌詞と英語補助を表示した結果画面](docs/images/build-week/result-en.png) |

## 解決したいこと

「わくわく」「しとしと」「きらきら」のような日本語のオノマトペは、単語だけで暗記するより、意味のある例文とリズムを一緒に体験した方が記憶へ結び付きます。

SingLinkでは、学習者自身は歌いません。学習者が4問の穴埋めクイズに答えたあと、**ずんだもんが4つの正しい例文を歌います**。合成に使うScoreの音符情報から日本語歌詞をカラオケ表示し、英語モードでは英訳例文と意味を添えます。

OpenAI Build Weekの **Education** カテゴリ向けプロジェクトです。歌唱力を評価するアプリではなく、カラオケ表示を記憶の補助に使います。

## 通常モードの仕組み

1. 5曲から元になるメロディを選びます。
2. ランダムに選ばれた日本語オノマトペ4問に答えます。
3. 正しい4例文を4フレーズのScoreへ割り当てます。
4. ローカルのVOICEVOXでずんだもんの歌声を生成します。
5. 歌声と伴奏を同時に再生し、各音符の `frame_length` を93.75 fpsで時間へ変換して文字を光らせます。
6. 英語モードだけ、日本語の下に英訳例文と意味を表示します。

所有者提供の語彙順を基に、例文・意味・歌唱用読み・英語補助を新規作成した335件の教材を同梱しています。アカウント、APIキー、クラウドDBは不要です。

## 主な機能

- 新規作成した例文、歌唱用読み、英訳例文、英語意味を持つオノマトペ教材335件
- 1プレイ4問のランダム出題
- 5曲から元曲を選択
- 英語初期表示と、保存される英語・日本語切替
- 英語専用4ステップの「あそびかた」
- 固定タイマーではなくScoreに基づく文字単位カラオケ同期
- 再生、一時停止、再開、最初から再生
- サーバー経路とブラウザ直接経路のローカルVOICEVOX接続
- IndexedDBによるブラウザ内の生成履歴
- 1280×720、820×1180、390×844のレスポンシブ確認
- 動きを減らすOS設定への対応
- 「幸せなら手をたたこう」のScore・伴奏と `VOICEVOX:ずんだもん` の事前生成歌唱を使う固定4問デモ

## Build Week期間中に追加したもの

[OpenAI Build Week公式Devpost](https://openai.devpost.com/) に記載された提出期間は2026年7月13日09:00 PT〜7月21日17:00 PTです。期間前の最終コミットは [`c1aab5f`](https://github.com/hachi-mori/SingLink-Parody-Song-Maker/commit/c1aab5fac5e139ce10ffc8532fd655cbddbade81) です。

### 期間前

- 既存のC++ / Siv3D版 SingLink
- Web版の基本画面とフロー
- 替え歌生成とローカルVOICEVOX連携の基礎
- ブラウザ内の生成履歴

C++ / Siv3D版は履歴・参照用に残していますが、Build Week提出の主対象ではありません。

### 期間中

- [`2916f58`](https://github.com/hachi-mori/SingLink-Parody-Song-Maker/commit/2916f58): 動的オノマトペScore生成をWeb版へ移植
- [`416fe42`](https://github.com/hachi-mori/SingLink-Parody-Song-Maker/commit/416fe42): 5曲選択を追加
- [`f7da284`](https://github.com/hachi-mori/SingLink-Parody-Song-Maker/commit/f7da284): 100語を出題と歌唱へ接続
- [`759273d`](https://github.com/hachi-mori/SingLink-Parody-Song-Maker/commit/759273d): 出版社教材由来の提出本文を除去し、例文・意味・歌唱用読みを新規作成
- [`67e63f8`](https://github.com/hachi-mori/SingLink-Parody-Song-Maker/commit/67e63f8): 新規作成した学習内容を335語分へ拡張
- [`2391294`](https://github.com/hachi-mori/SingLink-Parody-Song-Maker/commit/2391294): 英語データ、i18n、字幕監査、Score由来カラオケ時刻を追加
- [`a654981`](https://github.com/hachi-mori/SingLink-Parody-Song-Maker/commit/a654981): 4問化と音符単位の文字進行を追加
- [`44d87fc`](https://github.com/hachi-mori/SingLink-Parody-Song-Maker/commit/44d87fc)〜[`2ae471f`](https://github.com/hachi-mori/SingLink-Parody-Song-Maker/commit/2ae471f): 横長・縦長・モバイル・英語初期表示・言語別表示を調整
- [`d33da28`](https://github.com/hachi-mori/SingLink-Parody-Song-Maker/commit/d33da28): VOICEVOX不要の事前生成デモ素材を追加
- [`019a132`](https://github.com/hachi-mori/SingLink-Parody-Song-Maker/commit/019a132): 固定4問を解いてデモ結果へ進む流れに変更
- [`2bc0f00`](https://github.com/hachi-mori/SingLink-Parody-Song-Maker/commit/2bc0f00): 既存の「幸せなら手をたたこう」の楽譜・伴奏をデモに使用

詳細は [docs/build-week-development.md](docs/build-week-development.md) にまとめています。

## Codex / GPT-5.6の使い方

CodexとGPT-5.6を、旧C++実装の追跡、Score変換の移植、335教材の対応照合、335件×5曲の検証、英語UIと字幕監査、VOICEVOXのScoreフレームからの同期設計、3画面幅の実ブラウザ確認、独立レビューに使いました。

親のGPT-5.6 Solエージェントが設計・統合・検証・コミットを担当し、GPT-5.6 Terraエージェントが範囲を限定した調査・実装・読み取り専用レビューを担当しました。提案をそのまま採用せず、コード、Git履歴、テスト、ブラウザ、VOICEVOX出力で確認しました。

### 人間が決めたこと

- 日本のカラオケ文化を学習体験に使うこと
- 学習者ではなく、ずんだもんが歌うこと
- 日本語を学習対象、英語を補助情報にすること
- 出版社教材由来の本文を除去し、例文・意味・歌唱用読みを新規作成すること
- 提出版を英語初期表示にすること
- 固定タイマーではなく実Scoreを同期の正本にすること
- 通常モードと区別した固定公開デモを用意すること
- 横長・縦長・モバイルの具体的なレイアウト

正式なCodex Session IDはGit履歴から推測せず、提出者本人が `/feedback` で取得してDevpostへ入力します。

## 技術構成

| 領域 | 実装 |
| --- | --- |
| クライアント | React 19、TypeScript、Vite |
| サーバー | Fastify、TypeScript |
| 共通処理 | 教材解析、かな・モーラ、Score生成、同期時刻、WAV処理 |
| 歌声 | ローカルVOICEVOX。0.25.1とずんだもんで確認 |
| 保存 | ブラウザのIndexedDB。サーバーDBなし |
| 素材 | ローカル教材、5つのScore、5つの伴奏WAV、UI画像、事前生成デモmanifest/WAV |

## 最短起動手順（Windows）

必要なもの:

- Windows
- Node.js `^20.19.0` または `>=22.12.0`（Node.js 22推奨）
- npm
- 歌声確認用の [VOICEVOX](https://voicevox.hiroshiba.jp/)（確認済みバージョン0.25.1）

```powershell
git clone https://github.com/hachi-mori/SingLink-Parody-Song-Maker.git
cd SingLink-Parody-Song-Maker
git switch openai-build-week
cd web
npm ci
npm.cmd run dev
```

[http://127.0.0.1:5173/](http://127.0.0.1:5173/) を開きます。クライアントは5173、ローカルAPIは5174、VOICEVOX初期値は `http://localhost:50021` です。

335件のサンプル教材と5曲の素材は同梱済みで、デモアカウントや環境ファイルは不要です。「固定問題デモを遊ぶ」（または `http://127.0.0.1:5173/?demo=1`）では、VOICEVOXを起動せずに固定4問と同梱済み歌唱・字幕・カラオケ同期を確認できます。これは事前生成サンプルで、入力から新しい歌声は作りません。通常モードでは、クイズ回答から歌声をリアルタイム生成します。詳しい確認順は [審査員向け手順](docs/judge-testing-guide.md) を参照してください。

## VOICEVOX

1. [公式サイト](https://voicevox.hiroshiba.jp/)からVOICEVOXをインストールします。
2. テスト前にVOICEVOXを起動します。
3. タイトル画面のURLは通常 `http://localhost:50021` のままにします。
4. 接続成功表示を確認します。

サーバー側の接続先を変える場合:

```powershell
$env:VOICEVOX_BASE_URL = "http://localhost:50021"
npm.cmd run dev
```

VOICEVOXなしでもクイズとテキスト結果は確認できます。歌声生成にはローカルエンジンが必要です。

## 審査の確認順

最短の公開経路は、[GitHub Pagesの固定4問デモ](https://hachi-mori.github.io/SingLink-Parody-Song-Maker/openai-build-week/?demo=1)です。VOICEVOXは不要ですが、再生される歌唱は入力内容によらない事前生成サンプルです。回答に基づく歌声生成を確認する場合は、次のローカル経路を使います。

1. `Language` を `English` のままにします。
2. `How to play` を開き、英語4ステップを確認します。
3. タイトルへ戻り、オノマトペと5曲のいずれかを選びます。
4. 4問に答えます。誤答しても最後まで進めます。
5. 4つの正解例文を合成します。VOICEVOXがない場合は音声なし結果へ進みます。
6. 結果画面で、日本語歌詞4行、英訳例文、意味、カラオケ着色を確認します。
7. 一時停止・再開を試し、音声を生成した場合は `Saved songs` でブラウザ内履歴を確認します。

## 検証コマンド

```powershell
cd web
npm.cmd run test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run audit:english-subtitles
```

2026年7月19日の確認結果:

- Vitest: 9ファイル、37件成功
- TypeScript型チェック: 成功
- Web本番ビルド: 成功
- 英語字幕監査: 335/335件
- VOICEVOX 0.25.1: ローカル経路で4文の歌声生成を確認
- ブラウザ: 1280×720、820×1180、390×844で主要フローを確認
- 公開Pages: タイトルボタンと `?demo=1` から固定4問、事前生成表示、字幕、クレジット、再生中の同期歌詞を確認

提出ドキュメントのコミットでも再実行し、最終結果を [CODEX_STATUS.md](CODEX_STATUS.md) に記録します。

## 既知制限

- GitHub Pagesは静的UIと事前生成デモを配信できますが、Fastifyや回答に基づくローカルVOICEVOX歌声生成は単体では動きません。リアルタイム生成の正式な審査経路はWindowsのローカル起動です。
- スマートフォンからのローカルVOICEVOX合成は対応経路ではありません。
- ユーザーアカウント、クラウド同期、サーバー側履歴DBはありません。
- 英語教材は構造監査済みですが、教育用の自然さは今後も人間の言語レビュー対象です。
- MIT Licenseの対象はプロジェクトのコードであり、同梱素材すべてではありません。画像、フォント、音声、Score、生成歌声、第三者パッケージには [適用範囲](LICENSE_SCOPE.md) と [第三者素材一覧](THIRD_PARTY_NOTICES.md) に記載した個別条件が適用されます。

## プライバシーと保存

通常モードの合成リクエストはタイトル画面で指定したVOICEVOX URLにだけ送ります。通常モードで生成したWAVとメタデータはブラウザのIndexedDBへ保存されます。固定デモWAVは静的素材として読み込み、`保存した曲` には追加しません。サイトデータを削除すると生成履歴は消えます。アクセス解析、認証、クラウドDB、実行時のOpenAI API呼び出しはありません。

## ライセンスとクレジット

- プログラム: hachi-mori
- デザイン・画像/GIF: Ryotsu（許諾を得て使用）
- 歌声: **VOICEVOX:ずんだもん**
- コードライセンス: [MIT](LICENSE)、Copyright © 2025–2026 hachi-mori
- ライセンス適用範囲: [LICENSE_SCOPE.md](LICENSE_SCOPE.md)
- Web依存関係: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
- 素材ごとの証拠状態: [docs/asset-inventory.md](docs/asset-inventory.md)

MIT Licenseは、Ryotsuの画像、ふてほど丸ゴシック、VOICEVOX・ずんだもん素材、生成歌声、曲素材、第三者依存関係を再ライセンスしません。再配布時は各リンク先の条件に従ってください。
