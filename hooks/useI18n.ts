import i18n from "@/lib/i18n";

export function useI18n() {
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
