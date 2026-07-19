import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildOnomatopoeiaTasks } from '../src/gameLogic';
import { buildOnomatopoeiaLyricsRows, createMemorizationScore, type MemorizationScoreJson } from '../src/memorizationScore';
import { memorizationSourceSongs } from '../src/memorizationSongs';
import { parseOnomatopoeiaCardEntries } from '../src/onomatopoeiaCards';

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8').replace(/^\uFEFF/, '')) as unknown;
}

const cardsJson = readJson('assets/dict/cards_text_data.json');
const readingsJson = readJson('assets/dict/cards_singing_readings.json');
const entries = parseOnomatopoeiaCardEntries(cardsJson, readingsJson);
const expectedWords = [
  'あたふた', 'あっさり', 'あやふや', 'いそいそ', 'いらいら', 'うきうき', 'うじゃうじゃ', 'うだうだ', 'うっかり', 'うっすら',
  'うっとり', 'うつらうつら', 'うとうと', 'うろうろ', 'うんざり', 'うんと', 'おいおい', 'おずおず', 'おそるおそる', 'おっとり',
  'かさかさ', 'がさがさ', 'かたかた', 'がたがた', 'かちかち', 'がちゃがちゃ', 'がつがつ', 'がっかり', 'がっくり', 'がっちり',
  'かっと', 'がみがみ', 'からから', 'からっと', 'がらりと', 'かりかり', 'がりがり', 'かんかん', 'がんがん', 'ぎくしゃく',
  'ぎざぎざ', 'ぎすぎす', 'きちんと', 'ぎっしり', 'きっちり', 'きっと', 'きっぱり', 'きびきび', 'ぎゅっと', 'ぎょっと',
  'きょろきょろ', 'きらきら', 'ぎらぎら', 'ぎりぎり', 'ぐいぐい', 'ぐうぐう', 'くしゃくしゃ', 'ぐしゃぐしゃ', 'くすくす', 'くたくた',
  'ぐちゃぐちゃ', 'くっきり', 'ぐつぐつ', 'ぐっすり', 'ぐったり', 'ぐっと', 'くよくよ', 'ぐらぐら', 'くりくり', 'くるくる',
  'ぐるぐる', 'くるり', 'ぐんぐん', 'ぐんと', 'げっそり', 'げらげら', 'けろっと', 'げんなり', 'ごくごく', 'ごしごし',
  'こそこそ', 'ごそごそ', 'ごたごた', 'ごちゃごちゃ', 'こつこつ', 'ごつごつ', 'こっそり', 'ごっちゃ', 'こってり', 'ことこと',
  'ころころ', 'ごろごろ', 'ごわごわ', 'こんがり', 'こんこん', 'こんもり', 'さくさく', 'ざっくばらん', 'ざっくり', 'さっさと',
  'さっと', 'ざっと', 'さっぱり', 'さらさら', 'ざらざら', 'ざわざわ', 'しくしく', 'しげしげ', 'しっかり', 'しっくり',
  'じっくり', 'じっと', 'しっとり', 'しとしと', 'しばしば', 'じめじめ', 'しゃきしゃき', 'しゃっくり', 'しゃぶしゃぶ', 'じゃらじゃら',
  'しょぼしょぼ', 'しょぼん', 'しょんぼり', 'じりじり', 'じろじろ', 'しわしわ', 'じわじわ', 'しんと', 'じんと', 'しんなり',
  'しんみり', 'すかすか', 'すかっと', 'ずきずき', 'すくすく', 'ずけずけ', 'すごすご', 'すたすた', 'すっかり', 'すっきり',
  'すっと', 'ずっと', 'すっぱり', 'すっぽり', 'ずばずば', 'ずばり', 'すやすや', 'ずらっと', 'すらり', 'ずらり',
  'すらりと', 'ずらりと', 'ずるずる', 'すれすれ', 'ずんぐり', 'ずんずん', 'すんなり', 'せっせと', 'そっくり', 'そっと',
  'ぞっと', 'そろそろ', 'たっぷり', 'たらたら', 'だらだら', 'だんだん', 'ちかちか', 'ちくちく', 'ちくり', 'ちびちび',
  'ちやほや', 'ちゃんと', 'ちょいちょい', 'ちょくちょく', 'ちょこちょこ', 'ちょっと', 'ちょっぴり', 'ちょろちょろ', 'ちらちら', 'ちらっと',
  'ちらほら', 'ちらり', 'ちりちり', 'ちんぷんかんぷん', 'つくづく', 'つやつや', 'つるつる', 'つんと', 'でかでか', 'てきぱき',
  'てっきり', 'でんと', 'どうどう', 'どきどき', 'どぎまぎ', 'とことん', 'どさくさ', 'どしどし', 'どたばた', 'どっさり',
  'どっと', 'とっとと', 'どっぷり', 'とぼとぼ', 'とろとろ', 'どろどろ', 'とんと', 'とんとん', 'どんどん', 'どんより',
  'なみなみ', 'にこにこ', 'にこり', 'にっこり', 'にやにや', 'にやり', 'ぬくぬく', 'ぬるぬる', 'ねばねば', 'のうのう',
  'のそのそ', 'のびのび', 'のろのろ', 'のんびり', 'ぱくぱく', 'ぱくり', 'ばさばさ', 'ぱさぱさ', 'ばたばた', 'ぱたぱた',
  'ぱちくり', 'ぱちぱち', 'はっきり', 'ばっさり', 'ぱったり', 'ばっちり', 'はっと', 'ぱっと', 'はらはら', 'ばらばら',
  'ぱらぱら', 'ぱりっと', 'ばりばり', 'ぱりぱり', 'ばんばん', 'ぱんぱん', 'ぴかぴか', 'びくびく', 'ぴくぴく', 'びしょびしょ',
  'ぴたっと', 'ひたひた', 'ぴちぴち', 'びちゃびちゃ', 'びっくり', 'びっしょり', 'びっしり', 'ひっそり', 'ぴったり', 'ひょいと',
  'ひょっこり', 'ひょっと', 'ひらひら', 'ふうふう', 'ふかふか', 'ぶくぶく', 'ふさふさ', 'ふっくら', 'ふっと', 'ぶつぶつ',
  'ふと', 'ふらっと', 'ふらふら', 'ぶらぶら', 'ぶらりと', 'ぷりぷり', 'ぶるぶる', 'ふわふわ', 'ふわり', 'ぶんぶん',
  'ぷんぷん', 'ふんわり', 'ぺこぺこ', 'べたべた', 'ぺたぺた', 'べったり', 'ぺったり', 'へとへと', 'べとべと', 'べらべら',
  'ぺらぺら', 'ぼうっと', 'ぽうっと', 'ぽかぽか', 'ほくほく', 'ぼこぼこ', 'ぼさぼさ', 'ぽたり', 'ぼちぼち', 'ぽっかり',
  'ほっそり', 'ぽっちゃり', 'ほっと', 'ぽつぽつ', 'ほとほと', 'ほのぼの', 'ぼやぼや', 'ぼろぼろ', 'ぽろぽろ', 'ほんのり',
  'ぽんぽん', 'ぼんやり', 'まちまち', 'むかむか', 'むしゃくしゃ', 'むっつり', 'めちゃ', 'めちゃくちゃ', 'めちゃめちゃ', 'もくもく',
  'もたもた', 'もりもり', 'もろもろ', 'やきもき', 'やんわり', 'ゆっくり', 'ゆったり', 'よたよた', 'よちよち', 'よぼよぼ',
  'よれよれ', 'よろよろ', 'わいわい', 'わくわく', 'わんわん'
] as const;

function getRecord(value: unknown): Record<string, unknown> {
  expect(value).toBeTypeOf('object');
  expect(value).not.toBeNull();
  expect(Array.isArray(value)).toBe(false);
  return value as Record<string, unknown>;
}

function containsInOrder(text: string, expected: string): boolean {
  let expectedIndex = 0;
  for (const character of text) {
    if (character === expected[expectedIndex]) {
      expectedIndex += 1;
    }
  }
  return expectedIndex === expected.length;
}

describe('335語のオノマトペカード', () => {
  it('許可済みCSVの第3列全335件を順番どおり使い、自作教材の必須項目をそろえる', () => {
    const cardsRoot = getRecord(cardsJson);
    const readingsRoot = getRecord(readingsJson);
    const records = cardsRoot.records;
    const readings = getRecord(readingsRoot.readings);

    expect(cardsRoot.record_count).toBe(335);
    expect(cardsRoot.provenance).toMatchObject({
      vocabulary: 'ユーザー提供CSVの第3列のみ',
      selection: '全335件を元の順番で採用',
      normalization: 'カタカナをひらがなへ機械変換'
    });
    expect(readingsRoot.record_count).toBe(335);
    expect(readingsRoot.provenance).toBe('cards_text_data.json の提出用自作335例文から新規作成した歌唱用ひらがな読み');
    expect(Array.isArray(records)).toBe(true);
    expect(records).toHaveLength(335);

    const words = (records as unknown[]).map((rawRecord, index) => {
      const record = getRecord(rawRecord);
      const word = record.onomatopoeia;
      const usages = record.usages;
      const meanings = record.meanings;
      expect(record.number).toBe(index + 1);
      expect(word).toBe(expectedWords[index]);
      expect(Array.isArray(usages)).toBe(true);
      expect(Array.isArray(meanings)).toBe(true);
      const usage = getRecord((usages as unknown[])[0]);
      const meaning = getRecord((meanings as unknown[])[0]);
      expect(usage.text).toEqual(expect.stringContaining(word as string));
      expect(meaning.text).toEqual(expect.any(String));
      expect((meaning.text as string).length).toBeGreaterThan(0);
      return word;
    });

    expect(words).toEqual(expectedWords);
    expect(new Set(words).size).toBe(335);
    expect(Object.keys(readings)).toEqual(expectedWords);
    for (const word of expectedWords) {
      expect(readings[word]).toEqual(expect.stringMatching(/^[ぁ-ゖー]+$/u));
      expect(readings[word]).toEqual(expect.stringContaining(word));
    }
  });

  it('335語すべてに問題文・表示文・歌唱用読みを用意する', () => {
    expect(entries).toHaveLength(335);
    expect(new Set(entries.map((entry) => entry.word)).size).toBe(335);

    for (const entry of entries) {
      expect(entry.questionText, entry.word).toContain('○○');
      expect(entry.questionText, entry.word).not.toContain(entry.answer);
      expect(entry.displayText, entry.word).toContain(entry.answer);
      expect(entry.singingReading, entry.word).toMatch(/^[ぁ-ゖー]+$/u);
      expect(entry.explanation.length, entry.word).toBeGreaterThan(0);
    }
  });

  it('全335例文を5曲それぞれで1例文1フレーズへ割り当てる', () => {
    for (const sourceSong of memorizationSourceSongs) {
      const baseScore = readJson(path.join('assets/score', sourceSong.scoreFileName)) as MemorizationScoreJson;
      for (const entry of entries) {
        const rows = Array.from({ length: 3 }, () => [entry.displayText ?? '', entry.singingReading ?? ''] as const);
        const result = createMemorizationScore(rows, baseScore);
        expect(result.phraseRanges, `${sourceSong.title}: ${entry.word}`).toHaveLength(3);
        expect(result.phraseRanges.at(-1)?.[1], `${sourceSong.title}: ${entry.word}`)
          .toBe(result.score.notes.length);
        expect(result.phraseRanges.every(([start, end]) => end > start), `${sourceSong.title}: ${entry.word}`)
          .toBe(true);
        const expectedSignature = entry.answer.replace(/[っー]/g, '');
        for (const [start, end] of result.phraseRanges) {
          const phraseLyrics = result.score.notes.slice(start, end).map((note) => note.lyric).join('').replace(/[っー]/g, '');
          expect(containsInOrder(phraseLyrics, expectedSignature), `${sourceSong.title}: ${entry.word}`).toBe(true);
        }
      }
    }
  });

  it('選ばれた問題の読みだけを合成用の行にする', () => {
    const selected = entries[0];
    expect(selected).toBeDefined();
    const tasks = buildOnomatopoeiaTasks(selected!, selected!.answer, true);

    expect(buildOnomatopoeiaLyricsRows(tasks)).toEqual([
      [selected!.answer, selected!.singingReading]
    ]);
  });

  it('8モーラのちんぷんかんぷんは回答プレースホルダーも8モーラへ広げて歌唱に渡す', () => {
    const selected = entries.find((entry) => entry.word === 'ちんぷんかんぷん');
    expect(selected).toBeDefined();
    const tasks = buildOnomatopoeiaTasks(selected!, selected!.answer, true);

    expect(tasks[1]?.syllables).toHaveLength(8);
    expect(tasks[1]?.userSyllables).toEqual(['ち', 'ん', 'ぷ', 'ん', 'か', 'ん', 'ぷ', 'ん']);
    expect(buildOnomatopoeiaLyricsRows(tasks)).toEqual([
      [selected!.answer, selected!.singingReading]
    ]);
  });
});
