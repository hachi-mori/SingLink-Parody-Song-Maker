import { replaceChoonWithVowel, splitOnomatopoeiaMoras } from './kana';
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

export function parseOnomatopoeiaCardEntries(cardsJson: unknown): OnomatopoeiaEntry[] {
  const root = isRecord(cardsJson) ? cardsJson : undefined;
  const records = Array.isArray(root?.records) ? root.records : [];

  return records.flatMap((record): OnomatopoeiaEntry[] => {
    if (!isRecord(record)) {
      return [];
    }

    const answer = getString(record.onomatopoeia);
    const usageText = getTextItems(record.usages).find((text) => text.includes(answer)) ?? '';
    const explanation = getTextItems(record.meanings).join(' / ');
    const answerMoraCount = splitOnomatopoeiaMoras(replaceChoonWithVowel(answer)).length;

    if (!answer || !usageText || answerMoraCount > 6) {
      return [];
    }

    return [{
      word: answer,
      reading: answer,
      answer,
      explanation,
      questionText: makeBlankQuestionText(usageText, answer)
    }];
  });
}
