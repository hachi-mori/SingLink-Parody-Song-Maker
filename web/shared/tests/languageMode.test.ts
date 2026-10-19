import { describe, expect, it } from 'vitest';
import { resolveInitialLanguage, showsEnglishLearningSupport } from '../src/languageMode';

describe('language mode', () => {
  it('defaults to Japanese when no language has been saved', () => {
    expect(resolveInitialLanguage(null)).toBe('ja');
  });

  it('keeps a saved Japanese language choice', () => {
    expect(resolveInitialLanguage('ja')).toBe('ja');
  });

  it('uses Japanese for legacy English and unknown saved values', () => {
    expect(resolveInitialLanguage('en')).toBe('ja');
    expect(resolveInitialLanguage('unknown')).toBe('ja');
    expect(resolveInitialLanguage(undefined)).toBe('ja');
  });

  it('shows English learning support only in English mode', () => {
    expect(showsEnglishLearningSupport('en')).toBe(true);
    expect(showsEnglishLearningSupport('ja')).toBe(false);
  });
});
