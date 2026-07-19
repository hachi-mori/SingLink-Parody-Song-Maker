import type { JsonObject, OnomatopoeiaEntry } from './types';

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getTextItems(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => isRecord(item) ? getString(item.text) : '')
    .filter(Boolean);
}

function makeBlankQuestionText(usageText: string, answer: string): string {
  return usageText.replace(answer, '○○');
}

export function parseOnomatopoeiaCardEntries(cardsJson: unknown, singingReadingsJson?: unknown): OnomatopoeiaEntry[] {
  const root = isRecord(cardsJson) ? cardsJson : undefined;
  const records = Array.isArray(root?.records) ? root.records : [];
  const readingsRoot = isRecord(singingReadingsJson) ? singingReadingsJson : undefined;
  const singingReadings = isRecord(readingsRoot?.readings) ? readingsRoot.readings : undefined;

  return records.flatMap((record): OnomatopoeiaEntry[] => {
    if (!isRecord(record)) {
      return [];
    }

    const answer = getString(record.onomatopoeia);
    const usageText = getTextItems(record.usages).find((text) => text.includes(answer)) ?? '';
    const explanation = getTextItems(record.meanings).join(' / ');
    const singingReading = getString(singingReadings?.[answer]);

    if (!answer || !usageText) {
      return [];
    }

    return [{
      word: answer,
      reading: answer,
      answer,
      explanation,
      questionText: makeBlankQuestionText(usageText, answer),
      displayText: usageText,
      singingReading: singingReading || undefined
    }];
  });
}

export type EnglishCardRecord = {
  onomatopoeia: string;
  meaning: string;
  exampleJapanese: string;
  exampleEnglish: string;
  reviewStatus: 'reviewed' | 'needsReview';
  reviewNote?: string;
};

export function parseEnglishCardRecords(value: unknown): EnglishCardRecord[] {
  const root = isRecord(value) ? value : undefined;
  const records = Array.isArray(root?.records) ? root.records : [];
  return records.flatMap((raw): EnglishCardRecord[] => {
    if (!isRecord(raw)) return [];
    const onomatopoeia = getString(raw.onomatopoeia);
    const meaning = getString(raw.meaning);
    const exampleJapanese = getString(raw.exampleJapanese);
    const exampleEnglish = getString(raw.exampleEnglish);
    const reviewStatus = raw.reviewStatus === 'reviewed' || raw.reviewStatus === 'needsReview'
      ? raw.reviewStatus
      : undefined;
    const reviewNote = getString(raw.reviewNote);
    if (!onomatopoeia || !reviewStatus) return [];
    return [{
      onomatopoeia,
      meaning,
      exampleJapanese,
      exampleEnglish,
      reviewStatus,
      reviewNote: reviewNote || undefined
    }];
  });
}

export function attachEnglishCardData(entries: OnomatopoeiaEntry[], englishJson: unknown): OnomatopoeiaEntry[] {
  const translations = new Map(parseEnglishCardRecords(englishJson).map((record) => [record.onomatopoeia, record]));
  return entries.map((entry) => {
    const translation = translations.get(entry.word);
    if (!translation || translation.exampleJapanese !== entry.displayText) {
      return entry;
    }
    return {
      ...entry,
      englishMeaning: translation.meaning || undefined,
      englishExample: translation.exampleEnglish || undefined,
      translationReviewStatus: translation.reviewStatus,
      translationReviewNote: translation.reviewNote
    };
  });
}
