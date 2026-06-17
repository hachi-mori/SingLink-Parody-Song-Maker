# シングリンク Web版

既存の Siv3D / C++ 版「シングリンク」を参照して作った Web 版です。既存の C++ プロジェクトは変更せず、`web/` 以下だけで独立して動く構成にしています。

## 技術構成

- client: TypeScript + React + Vite
- server: Node.js + TypeScript + Fastify
- shared: vvproj 処理、歌詞処理、型定義
- 保存: ブラウザ標準の IndexedDB
- 対応優先ブラウザ: Chrome / Edge

## 起動方法

事前に VOICEVOX を起動してください。初期接続先は `http://localhost:50021` です。

```powershell
cd web
npm install
npm run dev
```

ブラウザで次を開きます。

```text
http://127.0.0.1:5173/
```

## 素材配置

初期実装では既存 Siv3D 版の素材を `web/assets/` に手動コピーしています。

```text
web/assets/
├─ texture/
├─ inst/
├─ score/
└─ dict/
```

新しい曲や辞書を追加する場合も、自動同期ではなくこの配下に手動で置いてください。

## VOICEVOX 接続

サーバーはフロントエンドの代理として VOICEVOX にアクセスします。将来別の接続先を使う場合は、環境変数で差し替えできます。

```powershell
$env:VOICEVOX_BASE_URL = "http://localhost:50021"
npm run dev
```

画面上の URL 入力欄からも接続先を変更できます。

## 生成履歴

生成された WAV はサーバーDBには保存せず、ブラウザの IndexedDB に保存します。

保存される情報:

- WAV Blob
- 曲名
- 生成日時
- ファイル名
- 表示用歌詞
- 入力内容
- VOICEVOX 接続先

履歴画面から再生、削除、ダウンロードできます。ブラウザのサイトデータを削除すると履歴も消えます。

## 確認コマンド

```powershell
npm run typecheck
npm run test
npm run build
```

`npm run build` では、`dist/client/` にフロントエンド一式と `web/assets/` の素材をコピーします。

## GitHub Pages 公開について

GitHub Pages は静的ファイル配信のみのため、Node.js / Fastify の API サーバーは動きません。そのため公開版では次の扱いになります。

- タイトル、説明、曲選択、クイズ、歌詞プレビューは動きます。
- `.vvproj`、伴奏、辞書CSV、画像/GIFは `dist/client/assets/` から読み込みます。
- VOICEVOX 歌声生成は GitHub Pages 単体では動きません。
- VOICEVOX や合成サーバーが無い場合は、画面に注意文を出して停止します。
- 歌声生成まで確認したい場合は、従来どおりローカルで `npm run dev` と VOICEVOX を起動してください。

GitHub Pages に置く対象は `web/dist/client/` です。

## 実画面確認済み

- タイトル表示
- VOICEVOX `0.25.1` への接続確認
- 曲一覧取得
- ハッピーバースデーの歌詞入力
- VOICEVOX による WAV 生成
- 結果画面表示
- IndexedDB への履歴保存
- 履歴画面での保存データ表示
- 1280x720 / 820x1180 / 390x844 幅で横はみ出しなし

## 既知制限

- スマホ幅の UI 表示には対応していますが、ローカル VOICEVOX での合成は PC ローカル起動を推奨します。
- 公開 Web サービスとしてのユーザー管理、クラウド保存、サーバーDBは未実装です。
- GitHub Pages 版では歌声生成はできません。クイズ後に注意文を表示します。
- ローカル版で VOICEVOX が起動していない場合、合成画面でエラーを表示します。
