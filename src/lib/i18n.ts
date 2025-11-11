import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import Duration from "dayjs/plugin/duration";
import i18next from "i18next";

import { appConfig } from "./config";
import { watch } from "vue";

const context = import.meta.webpackContext("../../translations/", {
	recursive: true,
	regExp: /\.json$/
});

const translations: Map<string, unknown> = new Map();

for(const path of context.keys())
	translations.set(path, context(path));


i18next.on("languageChanged", (lng) => {
	dayjs.locale(lng);
});

await i18next.init({
	lng: appConfig.locale.language || navigator.language,
	fallbackLng: "en"
});

for(const [path, translation] of translations.entries()){
	const [, lang, ns] = /\/(.*)\/(.*)\.json$/.exec(path)!;

	await import(`dayjs/locale/${lang}`);
	i18next.addResourceBundle(lang, ns, translation);
}

dayjs.extend(LocalizedFormat);
dayjs.extend(Duration);
dayjs.locale(i18next.language);

watch(appConfig, async () => {
	await i18next.changeLanguage(appConfig.locale.language);
});

export default i18next;
