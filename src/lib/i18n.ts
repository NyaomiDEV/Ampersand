import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import Duration from "dayjs/plugin/duration";
import i18next from "i18next";

import { appConfig } from "./config";
import { watch } from "vue";
import { flattenObject } from "./util/misc";

const context = import.meta.webpackContext("../../translations/", {
	recursive: true,
	regExp: /\.json$/,
	include: /translations[\\/](en|it|de|es|fr|nl|ro|tr)/
});

const translations: Map<string, unknown> = new Map();

for(const path of context.keys())
	translations.set(path, context(path));

const enTranslationCount = translations
	.entries()
	.filter(x => x[0].startsWith("./en/"))
	.map(x => x[1] = Object.values(flattenObject(x[1] as object)).length)
	.reduce((p, c) => p + c, 0);

export function computePercentage(lang: string) {
	const count = translations
		.entries()
		.filter(x => x[0].startsWith(`./${lang}/`))
		.map(x => x[1] = Object.values(flattenObject(x[1] as object)).length)
		.reduce((p, c) => p + c, 0);

	return Math.floor(Math.min(100, 100 * (count / enTranslationCount)));
}

i18next.on("languageChanged", (lng) => {
	dayjs.locale(lng);
});

await i18next.init({
	lng: appConfig.locale.language || navigator.language,
	fallbackLng: "en",
	interpolation: {
		escapeValue: false
	}
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
