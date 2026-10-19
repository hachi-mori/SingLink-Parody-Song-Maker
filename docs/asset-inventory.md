# OpenAI Build Week 提出アセット台帳

更新日: 2026-07-22

この台帳は、現行 `web/scripts/copy-assets.mjs` の公開許可リストから本番成果物へ入る追跡ファイルを一覧化します。法的判断は行わず、リポジトリ内で確認できる証拠と不足だけを記録します。

## ステータス

- **提出データ**: Build Week向けに作成・置換した記録あり。
- **確認済**: 公式条件、作者、所有者の確認、または許諾要約を記録済み。
- **個別条件**: 公開可能だが、ルートMITとは異なる条件・クレジットが適用される。

## 提出用画面キャプチャ

| File/path | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `docs/images/build-week/title-en.png` | Local Web screenshot | 2026-07-19にデモ追加前のアプリを1280×720で撮影 | キャプチャ自体は提出用に新規取得。画面内画像はRyotsuの許諾範囲 | トリミング・加工なし | 追跡維持、現行READMEでは未掲載 | 画面内素材の個別条件に従う | 実ブラウザ確認記録、Ryotsu許諾要約 | 確認済 | 固定デモボタン追加前のため、現行UI証拠には公開Pagesを使う |
| `docs/images/build-week/how-to-en.png` | Local Web screenshot | 同上 | 同上 | 同上 | READMEへ掲載 | 同上 | 実ブラウザ確認記録、Ryotsu許諾要約 | 確認済 | 同上 |
| `docs/images/build-week/quiz-en.png` | Local Web screenshot | 同上 | 同上 | 同上 | READMEへ掲載 | 同上 | 実ブラウザ確認記録、Ryotsu許諾要約 | 確認済 | 同上 |
| `docs/images/build-week/result-en.png` | Local Web screenshot | 同上 | 同上 | 同上 | READMEへ掲載 | 同上 | 実ブラウザ・VOICEVOX確認記録、Ryotsu許諾要約 | 確認済 | 生成した問題・歌詞・英語補助を含む。画面内素材は元素材に従う |
| `docs/images/build-week/openai-build-week-thumbnail.png` | OpenAI Build Week video thumbnail | hachi-moriが2026-07-22に作成した提出用サムネイル。アプリ画面とRyotsu制作の既存UI・ずんだもん描写を含む | サムネイル自体は提出用に新規作成。画面内素材はRyotsu許諾・ずんだもんガイドラインの対象 | 編集済みの合成画像 | README英日へ掲載、YouTube動画へリンク | Design and artwork: Ryotsu、VOICEVOX音声を扱う動画は `VOICEVOX:ずんだもん` | Ryotsu許諾要約、動画クレジット、所有者確認 | 確認済 | SHA-256 `639FC570CB45A528A81AA718209FB1B2F23A2C3944DBEACED713FFB6AA2C1269` |

## 教材JSON

| File/path | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `web/assets/dict/cards_text_data.json` | Japanese learning JSON, 335 records | Build Week提出用に例文・意味を新規作成。語彙順は所有者提供CSV第3列 | 新規作成本文。入力語彙リストは所有者が利用可能と確認 | 旧100教材を置換し335件へ拡張 | ビルドへコピー | 未設定 | provenance、`759273d`、`67e63f8`、テスト、所有者確認 | 提出データ | 旧出版社本文との完全一致0件という監査記録あり |
| `web/assets/dict/cards_singing_readings.json` | Singing-reading JSON, 335 records | 上記335例文から新規作成 | 新規作成例文からの派生データ記録 | VOICEVOX用ひらがな読みに変換 | ビルドへコピー | VOICEVOX音声を使う成果物は別途クレジット | provenance、`67e63f8`、テスト | 提出データ | 読み再生成時はVOICEVOX条件も確認 |
| `web/assets/dict/cards_english_data.json` | English examples/meanings JSON, 335 records | Build Week提出用に作成 | 新規作成記録 | 日本語例文へ完全一致で関連付け | ビルドへコピー | 未設定 | `2391294`、`reviewStatus`、字幕監査 | 提出データ | 構造監査済み。人間の言語レビュー継続推奨 |

## 事前生成デモ

| File/path | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `web/assets/demo/manifest.json` | Demo manifest JSON, 4 fixed questions | Build Week中に生成スクリプトで作成。4例文は提出教材、Score・伴奏はhachi-mori制作 | 提出用作成記録と作者確認あり | `2bc0f00` で既存曲版へ置換 | ビルドとGitHub Pagesへコピー | manifest内に `VOICEVOX:ずんだもん` と曲資産ラベル | `d33da28`、`019a132`、`2bc0f00`、デモアセットテスト、所有者確認 | 確認済 | 固定4問、英語字幕、意味、Score由来カラオケ時刻、VOICEVOX 0.25.1を記録 |
| `web/assets/demo/zundamon-shiawase-demo.wav` | Pre-generated singing WAV, stereo 44.1 kHz 16-bit, 16.053秒、2,831,852 bytes | VOICEVOX 0.25.1、speaker 3003、ずんだもん ノーマルで生成。Score・伴奏はhachi-mori制作 | VOICEVOX・ずんだもん音源条件に従い公開・動画・ダウンロード可能 | 4つの固定例文を「幸せなら手をたたこう」のScoreへ割当 | Git追跡、Pages配信、結果画面で再生・ダウンロード可能 | **`VOICEVOX:ずんだもん`** | `2bc0f00`、manifest、`demoAssets.test.ts`、`web/assets/demo/NOTICE.md` | 個別条件 | SHA-256 `BD0A7EA9BECF47FD7D1B4DEAED5AEE674EA32B118CFB77E48E4340DB39709ACD` |

## 伴奏WAV

5件共通: hachi-mori本人が制作し、演奏または打ち込みを行い、WAVを書き出した伴奏です。第三者の市販録音・MIDIは使用していません。元旋律は所有者が利用可能な古い曲・伝承曲として確認し、既存歌詞は使用していません。伴奏WAVはSingLinkの実行・デモ用に同梱しますが、MIT対象外です。

| File/path | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `web/assets/inst/ちょうちょ.wav` | Accompaniment WAV | hachi-mori制作・演奏/打ち込み・書き出し | 所有者本人確認 | Build Week中の内容変更なし | ビルドへコピー | hachi-mori | `2916f58`、所有者確認 | 確認済 | MIT対象外 |
| `web/assets/inst/むすんでひらいて.wav` | Accompaniment WAV | 同上 | 同上 | 同上 | 同上 | hachi-mori | `2916f58`、所有者確認 | 確認済 | MIT対象外 |
| `web/assets/inst/大きな古時計.wav` | Accompaniment WAV | 同上 | 同上 | 同上 | 同上 | hachi-mori | `416fe42`、所有者確認 | 確認済 | MIT対象外 |
| `web/assets/inst/幸せなら手をたたこう.wav` | Accompaniment WAV | 同上 | 同上 | `2bc0f00`から公開固定デモでも使用 | ビルド・Pages・動画で利用 | hachi-mori | `416fe42`、`2bc0f00`、所有者確認 | 確認済 | MIT対象外 |
| `web/assets/inst/雪.wav` | Accompaniment WAV | 同上 | 同上 | Build Week中の内容変更なし | ビルドへコピー | hachi-mori | `416fe42`、所有者確認 | 確認済 | MIT対象外 |

## Score / VOICEVOX project

| File/path | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `web/assets/score/ちょうちょ.json` | Base Score JSON | hachi-mori制作 | 所有者本人確認 | 実行時にコピーへ歌詞を割当 | ビルドへコピー | hachi-mori | `2916f58`、所有者確認 | 確認済 | MIT対象外 |
| `web/assets/score/むすんでひらいて.json` | Base Score JSON | 同上 | 同上 | 同上 | 同上 | hachi-mori | `2916f58`、所有者確認 | 確認済 | MIT対象外 |
| `web/assets/score/大きな古時計.json` | Base Score JSON | 同上 | 同上 | 同上 | 同上 | hachi-mori | `416fe42`、所有者確認 | 確認済 | MIT対象外 |
| `web/assets/score/幸せなら手をたたこう.json` | Base Score JSON | 同上 | 同上 | 実行時とデモ生成時にコピーへ歌詞を割当 | ビルド・Pages・動画で利用 | hachi-mori | `416fe42`、`2bc0f00`、所有者確認 | 確認済 | MIT対象外 |
| `web/assets/score/雪.json` | Base Score JSON | 同上 | 同上 | 実行時にコピーへ歌詞を割当 | ビルドへコピー | hachi-mori | `416fe42`、所有者確認 | 確認済 | MIT対象外 |
| `web/assets/score/オノマトペ.vvproj` | VOICEVOX 0.25.1 project | プロジェクト所有者管理の旧VOICEVOXプロジェクト | 所有者管理資産 | 実行時にScoreへ変換 | ビルドへコピー | `VOICEVOX:ずんだもん` | 内部JSON、`2289f51` | 個別条件 | MIT対象外。内部track名は現行用途と異なる旧名を含む |

## UI画像・GIF

共通証拠: 全25件のPNG/GIFはRyotsu（旧表記 `りょつ`）の制作です。所有者は、SingLinkの公開・OpenAI Build Week提出用途についてRyotsuの許諾根拠を保管しています。私信の原本は個人情報を含む可能性があるため非公開とし、公開要約を [`docs/permissions/ryotsu-assets.md`](permissions/ryotsu-assets.md) に記録します。必須クレジットは **Design and artwork: Ryotsu**。画像はMIT対象外で、第三者への単独再利用許諾は行いません。ずんだもん描写には公式キャラクターガイドラインも適用します。

| File/path | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `web/assets/texture/assets/button/*.png` (6 files) | Button PNG | Ryotsu | SingLink公開・Build Week提出用途の許諾根拠あり | 現行ファイルを維持 | ビルド・Pages・提出画面で利用 | Ryotsu | 許諾要約、`2289f51` | 確認済 | MIT対象外。異なる用途・加工は別途確認 |
| `web/assets/texture/assets/*.png` (12 files, buttons excluded) | UI/character PNG | Ryotsu | 同上。ずんだもん描写はキャラクターガイドラインも適用 | 同上 | 同上 | Ryotsu | 許諾要約、`2289f51`、`9132d80` | 個別条件 | `story.png`等の未使用追跡素材を含む |
| `web/assets/texture/assets/*.gif` (7 files) | Animated UI/character GIF | Ryotsu | 同上。ずんだもん描写はキャラクターガイドラインも適用 | 同上 | 同上 | Ryotsu | 許諾要約、`2289f51`、`9132d80` | 個別条件 | 既存綴り `loding_background.gif` を維持 |

## フォント

| File/path | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `web/assets/texture/Futehodo-MaruGothic.ttf` | TrueType font | [絵に描いた虹 / isMe公式配布ページ](https://infiniterainbow.booth.pm/items/6468734) | SIL Open Font License 1.1。`OFL.txt`を隣接配置 | C++版からコピーした追跡TTFを所有者判断で維持 | Web fontとしてGit・ビルド・Pages配信可能 | isMe、SIL OFL 1.1 | 公式配布ページ、`web/assets/texture/OFL.txt`、SHA-256 | 個別条件 | 追跡TTFはVersion 1.000、`B782...2F6D`。ローカル保管1.03は`3AF0...91A8`で別hashのため置換していない |

## 実行時の外部要素

| Item | Type | Creator/source | License or permission | Modification | Redistribution status | Required credit | Evidence | Submission status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VOICEVOX | Local synthesis software | VOICEVOX project | [Software terms](https://voicevox.hiroshiba.jp/term/) | API経由でScoreからWAV生成 | 本体は同梱しない | VOICEVOX利用が分かる表記 | 公式規約、コード、所有者確認 | 確認済 | 利用条件変更時は再確認 |
| ずんだもん音源 | Voice library | SSS LLC / VOICEVOX distribution | [Voice terms](https://zunko.jp/con_ongen_kiyaku.html) | Scoreに基づく歌声生成 | 通常生成WAVをIndexedDB保存・DL可能。事前生成デモWAVはGit追跡・Pages配信・DL可能 | **`VOICEVOX:ずんだもん`** | 公式規約、speaker/style ID、demo manifest、NOTICE | 個別条件 | 動画または概要欄にもクレジットを残す |
| npm dependency tree | Software packages, 205 | npm lockfile | MIT/ISC/Apache-2.0/BSD-3-Clause/BlueOak-1.0.0/MPL-2.0/0BSD | bundle/開発ツールとして利用 | パッケージごとの条件に従う | 各ライセンスに従う | `web/package-lock.json` | 個別条件 | 詳細は `THIRD_PARTY_NOTICES.md` |
| Siv3D native project | Legacy SDK/application | OpenSiv3Dほか | Web実行対象外。上流・同梱資源の個別ライセンスに従う | Build Week主要変更なし | Webビルドには含まない | 上流条件に従う | native project files、上流ライセンス | 個別条件 | Web限定と全repo公開を区別 |

## 提出対象外として隔離したもの

旧 `Verb.csv`、旧 `オノマトペ.csv`、非提出の旧伴奏・`.vvproj` 等はGit追跡外かつ `copy-assets.mjs` の許可リスト外です。これらを再追跡または公開許可リストへ戻さないでください。

## 更新時の注意

現行Web公開素材について、公開を妨げる未解決項目は記録されていません。素材を追加・置換した場合は、作者・公式条件・必要クレジット・公開範囲をこの台帳へ追記し、`VOICEVOX:ずんだもん` とRyotsu表記を維持してください。
