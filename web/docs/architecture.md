# Web版アーキテクチャメモ

## 境界

`web/` は将来別リポジトリに切り出せるよう、既存 Siv3D 版から独立させています。既存 C++ は参照元であり、Web 版の実行には使いません。

## 処理の流れ

```text
Title
  ↓ 曲選択
GET /api/songs/:songId
  ↓
WriteLyrics
  ↓ solvedTasks / fullLyrics
Loading
  ↓ POST /api/synthesis
server:
  vvproj 読み込み
  ApplyParodyLyrics
  ConvertVVProjToScoreJSON
  VOICEVOX sing_frame_audio_query
  VOICEVOX frame_synthesis
  WAV 連結
  ↓ audio/wav
client:
  IndexedDB 保存
  ↓
Result / History
```

## shared

`shared/src` には UI や Node.js のファイル操作に依存しないロジックを置いています。

- `kana.ts`: 音節分割、長音変換、ひらがな判定
- `vvproj.ts`: talk 抽出、問題生成、歌詞置換、score JSON 変換
- `gameLogic.ts`: 入力検証、動詞クイズ、オノマトペ用タスク生成
- `types.ts`: client / server 共通型

## server

Fastify で API と静的素材配信を担当します。

- `/assets/*`: `web/assets` 配信
- `/api/songs`: 曲一覧
- `/api/songs/:songId`: 曲詳細、問題、辞書
- `/api/voicevox/version`: VOICEVOX 接続確認
- `/api/parody/preview`: 表示歌詞生成
- `/api/synthesis`: 歌声合成

VOICEVOX の接続先は `VOICEVOX_BASE_URL` またはフロントからの指定で変更できます。

## client

React の状態で Scene 相当の画面を切り替えています。React Router は使わず、既存 Siv3D の `SceneManager` に近い軽い構成にしています。

追加画面として `History` を持ち、IndexedDB の保存済み WAV を扱います。

## 保存方針

生成 WAV はサーバーDBに残しません。ブラウザの IndexedDB に保存します。

ファイル名:

```text
シングリンク_<曲名>_<YYYYMMDD-HHmmss>.wav
```
