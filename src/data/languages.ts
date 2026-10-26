// Languages Kova IA can translate to (same keys as the server).
export const LANGUAGES: Array<{ code: string; name: string }> = [
  { code: 'es', name: 'Español' }, { code: 'en', name: 'Inglés' }, { code: 'pt', name: 'Portugués' },
  { code: 'fr', name: 'Francés' }, { code: 'de', name: 'Alemán' }, { code: 'it', name: 'Italiano' },
  { code: 'ja', name: 'Japonés' }, { code: 'ko', name: 'Coreano' }, { code: 'zh', name: 'Chino' },
  { code: 'ru', name: 'Ruso' }, { code: 'ar', name: 'Árabe' }, { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turco' }, { code: 'pl', name: 'Polaco' }, { code: 'nl', name: 'Neerlandés' },
];
export const languageName = (code: string) => LANGUAGES.find((lang) => lang.code === code)?.name || code;
/** The system language if Kova supports it, otherwise Spanish. */
export const systemLanguage = () => {
  const code = (typeof navigator !== 'undefined' ? navigator.language : 'es').slice(0, 2).toLowerCase();
  return LANGUAGES.some((lang) => lang.code === code) ? code : 'es';
};
