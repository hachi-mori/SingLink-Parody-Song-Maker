# OpenAI Build Week 提出アセット台帳

更新日: 2026-07-19

この台帳は、現行 `web/scripts/copy-assets.mjs` の公開許可リストから本番成果物へ入る追跡ファイルを一覧化します。法的判断は行わず、リポジトリ内で確認できる証拠と不足だけを記録します。

## ステータス

- **提出データ**: Build Week向けに作成・置換した記録あり。
- **要確認**: 一部根拠はあるが、提出者本人の確認が必要。
- **要証拠**: 配布元、ライセンス、許諾記録のいずれかが不足。

## 提出用画面キャプチャ

| File/path | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `docs/images/build-week/title-en.png` | Local Web screenshot | 2026-07-19に現行アプリを1280×720で撮影 | キャプチャ自体は提出用に新規取得 | トリミング・加工なし | READMEへ掲載 | 画面内素材の条件に従う | 実ブラウザ確認記録 | 要確認 | 画面内のUI画像、フォント、キャラクター表現の権利状態は元素材に従う |
| `docs/images/build-week/how-to-en.png` | Local Web screenshot | 同上 | 同上 | 同上 | READMEへ掲載 | 同上 | 実ブラウザ確認記録 | 要確認 | 同上 |
| `docs/images/build-week/quiz-en.png` | Local Web screenshot | 同上 | 同上 | 同上 | READMEへ掲載 | 同上 | 実ブラウザ確認記録 | 要確認 | 同上 |
| `docs/images/build-week/result-en.png` | Local Web screenshot | 同上 | 同上 | 同上 | READMEへ掲載 | 同上 | 実ブラウザ・VOICEVOX確認記録 | 要確認 | 生成した問題・歌詞・英語補助を含む。画面内素材は元素材に従う |

## 教材JSON

| File/path | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `web/assets/dict/cards_text_data.json` | Japanese learning JSON, 335 records | Build Week提出用に作成。語彙順は所有者提供CSV第3列 | 本文は自作記録。入力列の利用根拠は要確認 | 旧100教材を置換し335件へ拡張 | ビルドへコピー | 未設定 | provenance、`759273d`、`67e63f8`、テスト | 要確認 | 旧出版社本文との完全一致0件という監査記録あり |
| `web/assets/dict/cards_singing_readings.json` | Singing-reading JSON, 335 records | 上記335例文から新規作成 | 自作派生データ記録 | VOICEVOX用ひらがな読みに変換 | ビルドへコピー | VOICEVOX音声を使う成果物は別途クレジット | provenance、`67e63f8`、テスト | 提出データ | 読み再生成時はVOICEVOX条件も確認 |
| `web/assets/dict/cards_english_data.json` | English examples/meanings JSON, 335 records | Build Week提出用に作成 | 自作記録 | 日本語例文へ完全一致で関連付け | ビルドへコピー | 未設定 | `2391294`、`reviewStatus`、字幕監査 | 提出データ | 構造監査済み。人間の言語レビュー継続推奨 |

## 伴奏WAV

5件共通: Git履歴ではC++版からWebへ追加。所有者から「著作権上問題ない」との記録はあるが、原曲、編曲、演奏、録音、制作者、出典URL、許諾書はリポジトリにありません。

| File/path | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `web/assets/inst/ちょうちょ.wav` | Accompaniment WAV | 不明、C++版からコピー | 所有者申告のみ | Build Week中の内容変更なし | ビルドへコピー | 要確認 | `2916f58`、rights audit | 要証拠 | 作曲・編曲・録音を分けて確認 |
| `web/assets/inst/むすんでひらいて.wav` | Accompaniment WAV | 不明、C++版からコピー | 所有者申告のみ | Build Week中の内容変更なし | ビルドへコピー | 要確認 | `2916f58`、rights audit | 要証拠 | 同上 |
| `web/assets/inst/大きな古時計.wav` | Accompaniment WAV | 不明、C++版からコピー | 所有者申告のみ | Build Week中の内容変更なし | ビルドへコピー | 要確認 | `416fe42`、rights audit | 要証拠 | 同上 |
| `web/assets/inst/幸せなら手をたたこう.wav` | Accompaniment WAV | 不明、C++版からコピー | 所有者申告のみ | Build Week中の内容変更なし | ビルドへコピー | 要確認 | `416fe42`、rights audit | 要証拠 | 同上 |
| `web/assets/inst/雪.wav` | Accompaniment WAV | 不明、C++版からコピー | 所有者申告のみ | Build Week中の内容変更なし | ビルドへコピー | 要確認 | `416fe42`、rights audit | 要証拠 | 同上 |

## Score / VOICEVOX project

| File/path | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `web/assets/score/ちょうちょ.json` | Base Score JSON | 不明、C++版からコピー | 所有者申告のみ | 実行時にコピーへ歌詞を割当 | ビルドへコピー | 要確認 | `2916f58` | 要証拠 | 旋律・編曲・データ作成者を確認 |
| `web/assets/score/むすんでひらいて.json` | Base Score JSON | 不明、C++版からコピー | 所有者申告のみ | 実行時にコピーへ歌詞を割当 | ビルドへコピー | 要確認 | `2916f58` | 要証拠 | 同上 |
| `web/assets/score/大きな古時計.json` | Base Score JSON | 不明、C++版からコピー | 所有者申告のみ | 実行時にコピーへ歌詞を割当 | ビルドへコピー | 要確認 | `416fe42` | 要証拠 | 同上 |
| `web/assets/score/幸せなら手をたたこう.json` | Base Score JSON | 不明、C++版からコピー | 所有者申告のみ | 実行時にコピーへ歌詞を割当 | ビルドへコピー | 要確認 | `416fe42` | 要証拠 | 同上 |
| `web/assets/score/雪.json` | Base Score JSON | 不明、C++版からコピー | 所有者申告のみ | 実行時にコピーへ歌詞を割当 | ビルドへコピー | 要確認 | `416fe42` | 要証拠 | 同上 |
| `web/assets/score/オノマトペ.vvproj` | VOICEVOX 0.25.1 project | 作成者・元データ不明、C++版からコピー | 所有者申告のみ。VOICEVOX条件とは別に曲データ権利が必要 | 実行時にScoreへ変換 | ビルドへコピー | `VOICEVOX:ずんだもん` + 曲/データ側の要確認表記 | 内部JSON、`2289f51` | 要証拠 | 内部track名は現行用途と異なる旧名を含む |

## UI画像・GIF

共通証拠: `web/README.md` は既存Siv3D版からの手動コピーと記載。`credit.png` は「プログラム はちもり / デザイン りょつ / 歌声合成 ずんだもん（VOICEVOX）」と表示しますが、各画像の作者・配布元・許諾条件を証明しません。現行ビルドは `texture/` 全体をコピーします。

| File/path | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `web/assets/texture/assets/button/credit.png` | Button PNG | C++版からコピー、作者未特定 | 記録なし | Build Week中の内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | — |
| `web/assets/texture/assets/button/howtoplay.png` | Button PNG | C++版からコピー、作者未特定 | 記録なし | 同上 | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | — |
| `web/assets/texture/assets/button/restart.png` | Button PNG | C++版からコピー、作者未特定 | 記録なし | 同上 | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | — |
| `web/assets/texture/assets/button/start.png` | Button PNG | C++版からコピー、作者未特定 | 記録なし | 同上 | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | — |
| `web/assets/texture/assets/button/story.png` | Button PNG | C++版からコピー、作者未特定 | 記録なし | 現行UIでは未使用 | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | 未使用なら公開許可リスト除外も検討 |
| `web/assets/texture/assets/button/title.png` | Button PNG | C++版からコピー、作者未特定 | 記録なし | Build Week中の内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | — |
| `web/assets/texture/assets/credit.png` | Credits PNG | プログラム はちもり、デザイン りょつを画像内に記載 | 個別素材条件なし | 内容変更なし | ビルドへコピー | 画像内表記あり。VOICEVOX表記は公式例と不一致 | 実画像、`2289f51` | 要確認 | `VOICEVOX:ずんだもん` を別途明記 |
| `web/assets/texture/assets/game_background.gif` | Background GIF | C++版からコピー、作者未特定 | 記録なし | 内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | — |
| `web/assets/texture/assets/game_background2.gif` | Background GIF | C++版からコピー、作者未特定 | 記録なし | 内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | — |
| `web/assets/texture/assets/game_frame.png` | Frame PNG | C++版からコピー、作者未特定 | 記録なし | 内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | — |
| `web/assets/texture/assets/howtoplay.png` | Japanese instructions PNG | C++版からコピー、作者未特定 | 記録なし | 日本語モードで維持、英語モードでは非表示 | ビルドへコピー | 要確認 | `2289f51`、`419b45b` | 要証拠 | — |
| `web/assets/texture/assets/loding_background.gif` | Loading GIF | C++版からコピー、作者未特定 | 記録なし | 内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | ファイル名は既存綴りを維持 |
| `web/assets/texture/assets/result_background.png` | Background PNG | C++版からコピー、作者未特定 | 記録なし | 内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | — |
| `web/assets/texture/assets/result_cloudy.gif` | Result GIF | C++版からコピー、作者未特定 | 記録なし | 内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | キャラクター描写の有無も確認 |
| `web/assets/texture/assets/result_frame.png` | Frame PNG | C++版からコピー、作者未特定 | 記録なし | 内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | — |
| `web/assets/texture/assets/result_rainy.gif` | Result GIF | C++版からコピー、作者未特定 | 記録なし | 内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | キャラクター描写の有無も確認 |
| `web/assets/texture/assets/result_sunny.gif` | Result GIF | C++版からコピー、作者未特定 | 記録なし | 内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | キャラクター描写の有無も確認 |
| `web/assets/texture/assets/story.png` | Story PNG | C++版からコピー、作者未特定 | 記録なし | 現行UIでは未使用 | ビルドへコピー | 要確認 | `2289f51`、`419b45b` | 要証拠 | 未使用なら公開許可リスト除外も検討 |
| `web/assets/texture/assets/title_background.png` | Background PNG | C++版からコピー、作者未特定 | 記録なし | 内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | — |
| `web/assets/texture/assets/title_frame.png` | Frame PNG | C++版からコピー、作者未特定 | 記録なし | 内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | — |
| `web/assets/texture/assets/title_frame_w_trans.png` | Frame PNG | C++版からコピー、作者未特定 | 記録なし | 内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | — |
| `web/assets/texture/assets/title_logo.png` | Logo PNG | C++版からコピー、作者未特定 | 記録なし | 内容変更なし | ビルドへコピー | 要確認 | `2289f51` | 要証拠 | プロジェクト名はSingLinkを維持 |
| `web/assets/texture/assets/zunda_kakusei.png` | Character PNG | Git記録はVOICEVOX画像への変更、元画像作者未特定 | 画像許諾記録なし。キャラクターガイドラインも適用確認が必要 | 内容変更なし | ビルドへコピー | 画像条件とキャラクター条件に従う | `9132d80` | 要証拠 | ずんだもん画像 |
| `web/assets/texture/assets/zunda_singing.gif` | Character GIF | 同上 | 同上 | 内容変更なし | ビルドへコピー | 同上 | `9132d80` | 要証拠 | ずんだもん画像 |
| `web/assets/texture/assets/zunda_sippai.png` | Character PNG | 同上 | 同上 | 内容変更なし | ビルドへコピー | 同上 | `9132d80` | 要証拠 | ずんだもん画像 |

## フォント

| File/path | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `web/assets/texture/Futehodo-MaruGothic.ttf` | TrueType font | 内部名 `FutehodoMaruGothic`、metadataに`isMe`。公式配布元未記録 | 同梱ライセンスなし。二次サイトはSIL OFL 1.1とするが未検証 | C++版からコピー、内容変更なし | `texture/` としてビルドへコピー、Web fontで実使用 | 要確認 | バイナリmetadata、CSS、`2289f51` | 要証拠 | 公式配布物・ライセンス本文・Web配信/再配布条件を取得 |

## 実行時の外部要素

| Item | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VOICEVOX | Local synthesis software | VOICEVOX project | [Software terms](https://voicevox.hiroshiba.jp/term/) | API経由でScoreからWAV生成 | 本体は同梱しない | VOICEVOX利用が分かる表記 | 公式規約、コード | 要確認 | 提出時の最新版規約を本人確認 |
| ずんだもん音源 | Voice library | SSS LLC / VOICEVOX distribution | [Voice terms](https://zunko.jp/con_ongen_kiyaku.html) | Scoreに基づく歌声生成 | WAVをIndexedDB保存・DL可能 | **`VOICEVOX:ずんだもん`** | 公式規約、speaker/style ID | 要確認 | 動画・アプリ紹介・生成物の条件を本人確認 |
| npm dependency tree | Software packages, 205 | npm lockfile | MIT/ISC/Apache-2.0/BSD-3-Clause/BlueOak-1.0.0/MPL-2.0/0BSD | bundle/開発ツールとして利用 | パッケージごとの条件に従う | 各ライセンスに従う | `web/package-lock.json` | 要確認 | 詳細は `THIRD_PARTY_NOTICES.md` |
| Siv3D native project | Legacy SDK/application | OpenSiv3Dほか | Web実行対象外。全リポジトリ提出なら別監査 | Build Week主要変更なし | Webビルドには含まない | 別途確認 | native project files | 要確認 | Web限定と全repo公開を区別 |

## 提出対象外として隔離したもの

旧 `Verb.csv`、旧 `オノマトペ.csv`、非提出の旧伴奏・`.vvproj` 等はGit追跡外かつ `copy-assets.mjs` の許可リスト外です。これらを再追跡または公開許可リストへ戻さないでください。

## 残作業

提出者本人が [submission-owner-checklist.md](submission-owner-checklist.md) の権利項目を完了し、証拠URL・許諾書・ライセンス本文をこの台帳へ追記してください。
