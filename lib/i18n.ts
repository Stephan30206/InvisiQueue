import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import fr from "@/locales/fr";
import en from "@/locales/en";

const i18n = new I18n({ fr, en });

i18n.locale = Localization.getLocales()[0]?.languageCode ?? "fr";
i18n.enableFallback = true;
i18n.defaultLocale = "fr";

export default i18n;
