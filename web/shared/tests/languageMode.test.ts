import { describe, expect, it } from 'vitest';
import { resolveInitialLanguage, showsEnglishLearningSupport } from '../src/languageMode';

describe('language mode', () => {
  it('defaults to English when no language has been saved', () => {
    expect(resolveInitialLanguage(null)).toBe('en');
  });

  it('keeps a saved Japanese language choice', () => {
    expect(resolveInitialLanguage('ja')).toBe('ja');
  });

  it('keeps a saved English language choice', () => {
    expect(resolveInitialLanguage('en')).toBe('en');
  });

  it('shows English learning support only in English mode', () => {
    expect(showsEnglishLearningSupport('en')).toBe(true);
    expect(showsEnglishLearningSupport('ja')).toBe(false);
  });
});
