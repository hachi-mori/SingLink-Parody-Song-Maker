# 効果音

Kenney「Interface Sounds 1.0」（2020-02-11）の3ファイルを使用しています。

- 公式配布ページ: https://kenney.nl/assets/interface-sounds
- ダウンロード: https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip
- 取得日: 2026-10-20
- 配布 ZIP の SHA-256: `f2193d072726d6758a5f7871b2dcc54dcce0d5c35c6f0a62f92549b327c81232`
- ライセンス: CC0 1.0（同梱の `License.txt` を原文のまま収録）
- ライセンス本文: https://creativecommons.org/publicdomain/zero/1.0/

| 用途 | 配布元のファイル | 長さ（概数） | 再生ゲイン | 再生時の平均レベル（概数） |
| --- | --- | --- | --- | --- |
| 操作 | `Audio/click_004.ogg` | 0.01秒 | 0.170 | -34 dBFS |
| 正解 | `Audio/confirmation_003.ogg` | 0.32秒 | 0.115 | -34 dBFS |
| 不正解 | `Audio/error_001.ogg` | 0.16秒 | 0.178 | -34 dBFS |

音源ファイル自体は無加工です。FFmpeg の volumedetect による平均レベルに基づき、
アプリ内の再生ゲインで小さめの音量に揃えています。短い操作音と長めの正誤音は
知覚上の音量が同じとは限らないため、聴感上の最終調整には試聴が必要です。
歌声音量とは独立しています。BGM は追加していません。

配布される効果音は上記3ファイルのみです。実行時に配布元へのアクセスは行いません。
