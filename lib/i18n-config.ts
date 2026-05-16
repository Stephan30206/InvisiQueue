import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import fr from "@/locales/fr";
import en from "@/locales/en";

const i18n = new I18n({ fr, en });

// Auto-detect device language
const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? "fr";
i18n.locale = deviceLanguage.startsWith("fr") ? "fr" : "en";

i18n.enableFallback = true;
i18n.defaultLocale = "fr";

export default i18n;

export type LanguageCode = "en" | "fr";

export const setLanguage = (lang: LanguageCode) => {
  i18n.locale = lang;
};

export const getCurrentLanguage = (): LanguageCode => {
  return (i18n.locale as LanguageCode) || "fr";
};
