import { useTheme } from './theme-provider';
import { translations } from './i18n';

export function useLanguage() {
  const { language } = useTheme();

  const t = (key: keyof typeof translations.en): any => {
    return translations[language][key as keyof typeof translations[language]];
  };

  return { t, language };
}
