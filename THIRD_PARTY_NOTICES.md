# Third-Party Notices and Evidence Status

Updated: 2026-07-19

This document records what the repository can currently prove about third-party software, services, voices, characters, music, scores, images, and fonts used by the SingLink Web submission. It is an evidence inventory, not legal advice and not a license grant.

Status labels:

- **Verified source**: an official source and applicable condition were located.
- **Recorded owner statement**: the project owner stated that use is permitted, but the repository does not contain the supporting document.
- **Needs evidence**: source, license, permission, or redistribution evidence is missing.
- **Not bundled**: required at runtime but not redistributed in this repository.

The file-by-file status is in [docs/asset-inventory.md](docs/asset-inventory.md). Items marked **Needs evidence** must be resolved by the owner before public repository distribution, Devpost submission, or demo-video publication.

The four screenshots under `docs/images/build-week/` were newly captured from the local Web app on July 19, 2026. The screenshots themselves are submission evidence, but embedded UI images, font rendering, and character depictions retain the evidence status of their source assets. They do not make those underlying assets cleared for redistribution.

## Project code license

There is no repository-wide `LICENSE` file. No code license is selected or granted by this notice. If the repository is submitted publicly, the owner must choose an appropriate license and define its scope. Third-party assets, voices, character material, music, fonts, and dependency licenses must not be relicensed as project code.

## VOICEVOX and Zundamon voice

| Item | Use in SingLink | Source/condition | Redistribution | Required credit | Status |
| --- | --- | --- | --- | --- | --- |
| VOICEVOX software/engine | Local singing synthesis, version endpoint, `audio_query`, singing/frame synthesis | [VOICEVOX software terms](https://voicevox.hiroshiba.jp/term/) require a credit that makes VOICEVOX use identifiable and require following the selected voice-library terms | VOICEVOX binaries are **not bundled** | VOICEVOX credit required | Verified source; not bundled |
| Zundamon voice library | Singing voice/style IDs used by server and browser-direct paths | [Official Zundamon voice terms](https://zunko.jp/con_ongen_kiyaku.html) give `VOICEVOX:ずんだもん` as the credit example | Generated WAV can be stored/downloaded; the owner must confirm the current terms for publication and redistribution | **`VOICEVOX:ずんだもん`** | Verified source; owner final review required |

The current legacy `credit.png` says `ずんだもん（VOICEVOX）`, which differs from the official example. The submission README uses the exact `VOICEVOX:ずんだもん` form. The owner must also place it in the app introduction/credits and in the demo video or description as required by the applicable current terms. See the official [VOICEVOX Q&A](https://voicevox.hiroshiba.jp/qa/).

## Zundamon character images

The following files depict or appear to depict Zundamon:

- `web/assets/texture/assets/zunda_kakusei.png`
- `web/assets/texture/assets/zunda_singing.gif`
- `web/assets/texture/assets/zunda_sippai.png`
- other backgrounds or frames may also include character artwork

The repository does not identify the image files' illustrator, original download/source, or permission record. Character guidelines and image-file permission are separate questions. The owner must review the current [Zundamon character guidelines](https://zunko.jp/guideline.html) and obtain evidence for the actual image files. Status: **Needs evidence**.

## Music, accompaniment recordings, and Scores

The Web build publishes five accompaniment WAV files and five base Score JSON files for:

- `ちょうちょ`
- `むすんでひらいて`
- `大きな古時計`
- `幸せなら手をたたこう`
- `雪`

It also publishes `web/assets/score/オノマトペ.vvproj`.

The prior rights-audit record says the owner stated that the accompaniment and music were safe to use. The repository does not contain the source recording, arranger/performer, score creator, permission document, or source URL. A song title alone is not evidence for the composition, arrangement, recording, or data file. Status: **Recorded owner statement / Needs evidence**.

## UI images and GIFs

The Web assets contain 25 PNG/GIF files. `web/README.md` and Git history show that they were copied from the existing C++ / Siv3D application. The image-based credits name programming by `はちもり` and design by `りょつ`, but do not establish the creator or terms for each file. Status: **Needs evidence**.

Before submission, record for every file:

- creator and original source;
- whether it is first-party, freely licensed, or used with permission;
- permission for GitHub publication, Devpost submission, demo-video use, modification, and redistribution; and
- any required credit.

## Font

`web/assets/texture/Futehodo-MaruGothic.ttf` is bundled into the Web build. The binary identifies the family as Futehodo Maru Gothic and contains `isMe` in its metadata. A secondary font directory describes the font as SIL Open Font License 1.1, but the repository contains neither the official distribution URL nor the license text. A secondary listing is not treated here as conclusive evidence.

Status: **Needs evidence**. Obtain the official distribution package and license text; confirm Web embedding, repository redistribution, modifications, and required notices before submission.

## Learning datasets

| Files | Recorded origin | Status |
| --- | --- | --- |
| `cards_text_data.json` | Newly written examples and meanings for 335 vocabulary records; vocabulary order came from the third column of an owner-provided CSV | New submission text recorded; permission for the source vocabulary column still needs owner evidence |
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

The owner must decide how full dependency license texts and copyright notices will accompany the distributed build. `package-lock.json` is the authoritative version graph for this snapshot.

## Siv3D / C++ legacy application

The legacy native application under `ずんだもんアイドルPJ/` uses Siv3D and contains its own engine/font resources. The Web runtime does not compile or ship that project. The upstream [OpenSiv3D repository](https://github.com/Siv3D/OpenSiv3D) identifies OpenSiv3D as MIT-licensed, but this repository does not currently contain a repository-level notice that inventories the exact native SDK snapshot and its bundled third-party resources.

If the whole repository, rather than only the Web submission, is distributed for judging, the native project requires its own full dependency and asset audit. Status: **Outside Web runtime / Needs repository-scope review**.

## Required owner actions

The unresolved evidence is tracked in [docs/submission-owner-checklist.md](docs/submission-owner-checklist.md). At minimum, resolve:

1. repository-wide code license;
2. source and permission for every image/GIF and the font;
3. source and permission for every accompaniment recording and Score;
4. source-column permission for the 335 vocabulary inputs;
5. exact VOICEVOX/Zundamon credits in the app and video; and
6. full notices policy for the dependency tree.
