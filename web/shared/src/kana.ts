const smallKanaForSyllables = new Set([...`ゃゅょぁぃぅぇぉっャュョァィゥェォッ`]);
const smallKanaForOnomatopoeia = new Set([...`ゃゅょぁぃぅぇぉャュョァィゥェォ`]);

const vowelGroups: Record<'a' | 'i' | 'u' | 'e' | 'o', string> = {
  a: 'あかさたなはまやらわがざだばぱぁゃアカサタナハマヤラワガザダバパァャ',
  i: 'いきしちにひみりゐぎじぢびぴぃイキシチニヒミリヰギジヂビピィ',
  u: 'うくすつぬふむゆるぐずづぶぷぅゅウクスツヌフムユルグズヅブプゥュ',
  e: 'えけせてねへめれゑげぜでべぺぇエケセテネヘメレヱゲゼデベペェ',
  o: 'おこそとのほもよろをごぞどぼぽぉょオコソトノホモヨロヲゴゾドボポォョ'
};

export function splitSyllables(text: string): string[] {
  const chars = [...text];
  const result: string[] = [];

  for (let i = 0; i < chars.length; i += 1) {
    let syllable = chars[i] ?? '';
    const next = chars[i + 1];
    if (next && smallKanaForSyllables.has(next)) {
      syllable += next;
      i += 1;
    }
    if (syllable) {
      result.push(syllable);
    }
  }

  return result;
}

export function splitOnomatopoeiaMoras(text: string): string[] {
  const chars = [...text];
  const result: string[] = [];

  for (let i = 0; i < chars.length; i += 1) {
    let mora = chars[i] ?? '';
    const next = chars[i + 1];
    if (next && smallKanaForOnomatopoeia.has(next)) {
      mora += next;
      i += 1;
    }
    if (mora) {
      result.push(mora);
    }
  }

  return result;
}

export function getVowel(syllable: string): 'a' | 'i' | 'u' | 'e' | 'o' | 'N' | 'Q' | 'X' {
  if (syllable === 'ん' || syllable === 'ン') {
    return 'N';
  }
  if (syllable === 'っ' || syllable === 'ッ') {
    return 'Q';
  }

  const lastChar = [...syllable].at(-1);
  if (!lastChar) {
    return 'X';
  }

  for (const [vowel, chars] of Object.entries(vowelGroups)) {
    if ([...chars].includes(lastChar)) {
      return vowel as 'a' | 'i' | 'u' | 'e' | 'o';
    }
  }

  return 'X';
}

export function isHiraganaOnly(text: string): boolean {
  return [...text].every((ch) => (ch >= 'ぁ' && ch <= 'ん') || ch === 'ー');
}

export function replaceChoonWithVowel(text: string): string {
  let result = '';

  for (const ch of [...text]) {
    if (ch === 'ー' && result.length > 0) {
      const prev = [...result].at(-1) ?? '';
      switch (getVowel(prev)) {
        case 'a':
          result += 'ア';
          break;
        case 'i':
          result += 'イ';
          break;
        case 'u':
          result += 'ウ';
          break;
        case 'e':
          result += 'エ';
          break;
        case 'o':
          result += 'オ';
          break;
        case 'N':
          result += 'ん';
          break;
        case 'Q':
          result += 'っ';
          break;
        default:
          result += 'ら';
          break;
      }
    } else {
      result += ch;
    }
  }

  return result;
}

export function vowelToKana(vowel: ReturnType<typeof getVowel>): string {
  switch (vowel) {
    case 'a':
      return 'あ';
    case 'i':
      return 'い';
    case 'u':
      return 'う';
    case 'e':
      return 'え';
    case 'o':
      return 'お';
    case 'N':
      return 'ん';
    case 'Q':
      return 'っ';
    default:
      return 'あ';
  }
}

export function makePlaceholderSyllables(syllable: string, count: number): string[] {
  return Array.from({ length: count }, () => syllable);
}
