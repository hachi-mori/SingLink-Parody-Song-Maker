export type AppLanguage = 'en' | 'ja';

export const languageStorageKey = 'singlink.language';

/**
 * The study UI is Japanese-only. Keep accepting old saved values so an older
 * English preference cannot bring back English labels after an update.
 */
export function resolveInitialLanguage(_savedLanguage: string | null | undefined): AppLanguage {
  return 'ja';
}

export function showsEnglishLearningSupport(language: AppLanguage): boolean {
  return language === 'en';
}
