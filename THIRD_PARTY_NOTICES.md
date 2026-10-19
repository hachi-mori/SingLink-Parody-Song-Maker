# Third-Party Notices and Evidence Status

Updated: 2026-07-22

This document records what the repository can currently prove about third-party software, services, voices, characters, music, scores, images, and fonts used by the SingLink Web submission. It is an evidence inventory, not legal advice and not a license grant.

Status labels:

- **Verified source**: an official source and applicable condition were located.
- **Owner confirmed**: the project owner confirmed authorship or permission and retains any private supporting record outside the public repository.
- **Permission recorded**: the applicable permission and public credit are summarized in this repository without publishing private correspondence.
- **Not bundled**: required at runtime but not redistributed in this repository.

The file-by-file status is in [docs/asset-inventory.md](docs/asset-inventory.md). The root MIT License does not override the asset-specific conditions recorded here.

The four screenshots under `docs/images/build-week/` were newly captured from the local Web app on July 19, 2026. `docs/images/build-week/openai-build-week-thumbnail.png` is a July 22 submission thumbnail created by hachi-mori from the app presentation and existing permitted artwork. These images are submission evidence, but embedded UI images, font rendering, and character depictions retain the evidence status of their source assets. They do not make those underlying assets cleared for redistribution.

## Project code license

Project source code and project-authored documentation are released under the [MIT License](LICENSE), Copyright © 2025–2026 hachi-mori. [LICENSE_SCOPE.md](LICENSE_SCOPE.md) defines the boundary: artwork, fonts, music assets, generated voice, VOICEVOX/Zundamon resources, and third-party dependencies are not relicensed as project code.

## VOICEVOX and Zundamon voice

| Item | Use in SingLink | Source/condition | Redistribution | Required credit | Status |
| --- | --- | --- | --- | --- | --- |
| VOICEVOX software/engine | Local singing synthesis, version endpoint, `audio_query`, singing/frame synthesis | [VOICEVOX software terms](https://voicevox.hiroshiba.jp/term/) require a credit that makes VOICEVOX use identifiable and require following the selected voice-library terms | VOICEVOX binaries are **not bundled** | VOICEVOX credit required | Verified source; not bundled |
| Zundamon voice library | Singing voice/style IDs used by server and browser-direct paths | [Official Zundamon voice terms](https://zunko.jp/con_ongen_kiyaku.html) allow commercial and non-commercial use subject to the common terms and credit | Generated WAV is stored/downloaded under those terms | **`VOICEVOX:ずんだもん`** | Verified source; owner reviewed |
| `web/assets/demo/zundamon-shiawase-demo.wav` | Bundled singing used by the public fixed-question demo | Generated with VOICEVOX 0.25.1, speaker 3003, Zundamon normal style; metadata and credit are recorded in `web/assets/demo/manifest.json` | Tracked in Git, copied into the Pages artifact, playable and downloadable from the result screen; conditions are repeated in `web/assets/demo/NOTICE.md` | **`VOICEVOX:ずんだもん`** | Provenance and publication use confirmed |

The public demo result, English application credits, README, and demo notice use the exact credit **`VOICEVOX:ずんだもん`**. The submission video or its description must retain that credit. See the official [VOICEVOX Q&A](https://voicevox.hiroshiba.jp/qa/).

## Zundamon character images

The following files depict or appear to depict Zundamon:

- `web/assets/texture/assets/zunda_kakusei.png`
- `web/assets/texture/assets/zunda_singing.gif`
- `web/assets/texture/assets/zunda_sippai.png`
- other backgrounds or frames may also include character artwork

All bundled PNG/GIF artwork was created by **Ryotsu** (previously credited in Japanese as `りょつ`). The project owner retains evidence that Ryotsu permitted the artwork to be used for SingLink's public presentation and OpenAI Build Week submission. The original private record remains offline; the public summary is [docs/permissions/ryotsu-assets.md](docs/permissions/ryotsu-assets.md).

Zundamon depictions additionally remain subject to the current [Zundamon character guidelines](https://zunko.jp/guideline.html). The artwork is not offered under the project's MIT License and no unrelated downstream reuse permission is granted here. Status: **Permission recorded**.

## Music, accompaniment recordings, and Scores

The Web build publishes five accompaniment WAV files and five base Score JSON files for:

- `ちょうちょ`
- `むすんでひらいて`
- `大きな古時計`
- `幸せなら手をたたこう`
- `雪`

It also publishes `web/assets/score/オノマトペ.vvproj`.

The project owner confirmed that **hachi-mori personally created the five Score files and created, performed/programmed, and exported all five accompaniment WAV files**. No third-party recording or commercial MIDI was used. The selected source melodies are traditional or old works reviewed by the owner as usable; SingLink does not reproduce their pre-existing lyrics. The first-party Score data, arrangement work, performance/programming, and recordings are included for SingLink's operation and demonstration but are not offered under the MIT License. Status: **Owner confirmed**.

The public fixed-question demo specifically uses `web/assets/score/幸せなら手をたたこう.json` and `web/assets/inst/幸せなら手をたたこう.wav`, both created by hachi-mori, together with the VOICEVOX/Zundamon conditions above.

## UI images and GIFs

The Web assets contain 25 PNG/GIF files copied from the existing C++ / Siv3D application. Ryotsu created all of them and granted the project-use permissions recorded above. Required public credit: **Design and artwork: Ryotsu**. Status: **Permission recorded**.

## Font

`web/assets/texture/Futehodo-MaruGothic.ttf` is bundled into the Web build. The [creator's distribution page](https://infiniterainbow.booth.pm/items/6468734) identifies the creator as **isMe**, permits commercial use, modification, and redistribution, and releases the font under SIL Open Font License 1.1. The standard license text is bundled beside the font as [`web/assets/texture/OFL.txt`](web/assets/texture/OFL.txt).

The tracked TTF identifies itself as Version 1.000 and is retained unchanged at the owner's direction. Its SHA-256 is `B7826D47C7C5E41E5AEE287995688EF336CE74F6B57732DE7999340D426C2F6D`. A locally retained version 1.03 source TTF was also located and has SHA-256 `3AF07164F265C9FA101DDE3C99D392A28A4F1DB5EE4A7790A5B976F4B29191A8`; the differing hash is recorded without replacing the deployed font. Status: **Verified source and license**.

## Learning datasets

| Files | Recorded origin | Status |
| --- | --- | --- |
| `cards_text_data.json` | Newly written examples and meanings for 335 vocabulary records; vocabulary order came from the third column of an owner-provided CSV | First-party submission text; owner authorized the input vocabulary list |
| `cards_singing_readings.json` | Singing readings newly created for the 335 submission examples | First-party/derived submission data recorded |
| `cards_english_data.json` | English meanings and examples created for the 335 Japanese records, with structural review status and automated cross-checks | First-party submission data recorded; ongoing human language review recommended |

Publisher-derived example sentences, meanings, and readings were removed from the tracked submission data. The old CSV and non-submission assets are excluded from Git and the production copy allowlist.

## Web direct dependencies

Versions and license identifiers below come from `web/package-lock.json`. They are identifiers, not substitutes for each package's full license and copyright notices.

| Package | Locked version | License identifier |
| --- | ---: | --- |
| [`@fastify/cors`](https://www.npmjs.com/package/@fastify/cors) | 11.2.0 | MIT |
| [`@fastify/static`](https://www.npmjs.com/package/@fastify/static) | 9.1.3 | MIT |
| [`fastify`](https://www.npmjs.com/package/fastify) | 5.8.5 | MIT |
| [`idb`](https://www.npmjs.com/package/idb) | 8.0.3 | ISC |
| [`lucide-react`](https://www.npmjs.com/package/lucide-react) | 0.468.0 | ISC |
| [`react`](https://www.npmjs.com/package/react) | 19.2.7 | MIT |
| [`react-dom`](https://www.npmjs.com/package/react-dom) | 19.2.7 | MIT |
| [`zod`](https://www.npmjs.com/package/zod) | 3.25.76 | MIT |
| [`@types/node`](https://www.npmjs.com/package/@types/node) | 25.9.3 | MIT |
| [`@types/react`](https://www.npmjs.com/package/@types/react) | 19.2.17 | MIT |
| [`@types/react-dom`](https://www.npmjs.com/package/@types/react-dom) | 19.2.3 | MIT |
| [`@vitejs/plugin-react`](https://www.npmjs.com/package/@vitejs/plugin-react) | 6.0.2 | MIT |
| [`concurrently`](https://www.npmjs.com/package/concurrently) | 10.0.3 | MIT |
| [`tsx`](https://www.npmjs.com/package/tsx) | 4.22.4 | MIT |
| [`typescript`](https://www.npmjs.com/package/typescript) | 6.0.3 | Apache-2.0 |
| [`vite`](https://www.npmjs.com/package/vite) | 8.0.16 | MIT |
| [`vitest`](https://www.npmjs.com/package/vitest) | 4.1.8 | MIT |

The lockfile contains 205 dependency packages in total:

| License identifier | Packages |
| --- | ---: |
| MIT | 166 |
| ISC | 13 |
| Apache-2.0 | 4 |
| BSD-3-Clause | 4 |
| BlueOak-1.0.0 | 5 |
| MPL-2.0 | 12 |
| 0BSD | 1 |

`package-lock.json` is the authoritative version graph for this snapshot. Each dependency remains under its own license; the root MIT License does not relicense it.

## Siv3D / C++ legacy application

The legacy native application under `ずんだもんアイドルPJ/` uses Siv3D and contains its own engine/font resources. The Web runtime does not compile or ship that project. The upstream [OpenSiv3D repository](https://github.com/Siv3D/OpenSiv3D) identifies OpenSiv3D as MIT-licensed, but this repository does not currently contain a repository-level notice that inventories the exact native SDK snapshot and its bundled third-party resources.

The root MIT License applies only to project-owned code. Siv3D and its bundled third-party resources retain their own notices and licenses. Status: **Outside Web runtime / separate upstream licenses**.

## Publication checklist

The code license and listed Web-asset provenance decisions are recorded. Before publishing a new release or video, retain the exact **`VOICEVOX:ずんだもん`** credit, do not describe excluded assets as MIT-licensed, and recheck official terms if the voice, font, or character resources are changed.
