import dayjs from "dayjs";
import i18next from "i18next";

import { appConfig } from "./config";

const context = import.meta.webpackContext("../../translations/", {
	recursive: true,
	regExp: /\.json$/
});

const translations: Map<string, any> = new Map();

for(const path of context.keys()){
	translations.set(path, context(path));
}

i18next.on("languageChanged", async (lng) => {
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

dayjs.locale(i18next.language);

export default i18next;
