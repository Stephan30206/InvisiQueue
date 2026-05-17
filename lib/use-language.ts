import { translations } from './i18n';
import { useTheme } from './theme-provider';

type Language = keyof typeof translations;

type DeepKeys<T> = T extends string
  ? []
  : { [K in keyof T]: [K, ...DeepKeys<T[K]>] }[keyof T];

type Join<T extends unknown[]> = T extends [infer F, ...infer R]
  ? R extends []
    ? `${F & string}`
    : `${F & string}.${Join<R>}`
  : never;

type TranslationPath = Join<DeepKeys<typeof translations['en']>>;

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path;
}

export function useLanguage() {
  const { language } = useTheme();
  const lang = language as Language;

  const t = (
    path: TranslationPath,
    vars?: Record<string, string | number>
  ): string => {
    let value = getNestedValue(translations[lang], path);

    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        value = value.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }

    return value;
  };

  return { t, language: lang };
}
