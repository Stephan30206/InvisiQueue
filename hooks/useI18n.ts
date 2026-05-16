import { useLanguage } from "@/lib/LanguageContext";
import i18n from "@/lib/i18n-config";

export function useI18n() {
  useLanguage(); // Subscribe to language changes

  return {
    t: (key: string, options?: any) => {
      try {
        return i18n.t(key, options);
      } catch (err) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    },
  };
}
