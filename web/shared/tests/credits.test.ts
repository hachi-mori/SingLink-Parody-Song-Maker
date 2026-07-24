import { describe, expect, it } from 'vitest';
import { creditLinks, englishCreditSections } from '../../client/src/lib/credits';

describe('English credits', () => {
  it('shows the confirmed authorship and required attributions', () => {
    const text = englishCreditSections.map(({ label, title, body }) => `${label} ${title} ${body}`).join('\n');

    expect(text).toContain('hachi-mori');
    expect(text).toContain('Ryotsu');
    expect(text).toContain('MIT License');
    expect(text).toContain('VOICEVOX:ずんだもん');
    expect(text).toContain('Futehodo Maru Gothic');
    expect(text).toContain('SIL Open Font License 1.1');
    expect(creditLinks.map(({ label }) => label)).toEqual([
      'Code license',
      'Asset notices',
      'VOICEVOX terms',
      'Zundamon guidelines',
      'Font license'
    ]);
  });
});
