import { translations } from './i18n';
import { useTheme } from './theme-provider';

type Language = keyof typeof translations;             
type TranslationKey = keyof typeof translations['en']; 

export function useLanguage() {
  const { language } = useTheme();

  const lang = language as Language;

  const t = (key: TranslationKey): typeof translations['en'][TranslationKey] => {
    return translations[lang][key];
  };

  return { t, language: lang };
}