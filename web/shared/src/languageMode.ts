export type AppLanguage = 'en' | 'ja';

export const languageStorageKey = 'singlink.language';

/**
 * This Build Week branch starts in English unless the learner has explicitly
 * chosen a language before. Keeping this pure also makes storage behaviour
 * straightforward to verify without a browser.
 */
export function resolveInitialLanguage(savedLanguage: string | null | undefined): AppLanguage {
  return savedLanguage === 'ja' ? 'ja' : 'en';
}

export function showsEnglishLearningSupport(language: AppLanguage): boolean {
  return language === 'en';
}
