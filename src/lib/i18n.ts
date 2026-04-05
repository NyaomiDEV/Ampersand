import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import RelativeTime from "dayjs/plugin/relativeTime";
import Duration from "dayjs/plugin/duration";
import UTC from "dayjs/plugin/utc";
import i18next from "i18next";
import { getWeekInfo } from "./util/week-info";

import { appConfig } from "./config";
import { watch } from "vue";
import { flattenObject } from "./util/misc";

const context = import.meta.webpackContext("../../translations/", {
	recursive: true,
	regExp: /\.json$/,
	include: /translations[\\/](de|en|en-x-furry|en-x-meatball|en-x-nwspk|en-x-pirate|en-x-shkspr|es|fr|it|it-x-genz|it-x-milan|nap|nl|pl|ro|ru|scn|tok|tr)[\\/]/
});

const translations: Map<{ lang: string, ns: string }, unknown> = new Map();

for(const path of context.keys()){
	const [, lang, ns] = /\/(.*)\/(.*)\.json$/.exec(path)!;
	translations.set({ lang, ns }, context(path));
}

const enTranslationCount = translations
	.entries()
	.filter(x => x[0].lang === "en")
	.map(x => x[1] = Object.values(flattenObject(x[1] as object)).length)
	.reduce((p, c) => p + c, 0);

export function computePercentage(lang: string) {
	const count = translations
		.entries()
		.filter(x => x[0].lang === lang)
		.map(x => x[1] = Object.values(flattenObject(x[1] as object)).length)
		.reduce((p, c) => p + c, 0);

	return Math.floor(Math.min(100, 100 * (count / enTranslationCount)));
}

export function getSupportedLanguageFromNavigator(){
	for(const potentialLanguage of navigator.languages){
		const found = translations.keys().find(x => x.lang === potentialLanguage || x.lang === potentialLanguage.split("-")[0].toLowerCase());
		if(found)
			return found.lang;
	}
	return undefined;
}

export function getLocaleInfo(){
	const dateTimeOpts = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions();
	return {
		firstDayOfWeek: getWeekInfo(new Intl.Locale(dateTimeOpts.locale)).firstDay || 1,
		hourCycle: dateTimeOpts.hourCycle,
		hour12: dateTimeOpts.hour12,
		lts: dateTimeOpts.hour12 ? "hh:mm:ss A" : "HH:mm:ss",
		lt: dateTimeOpts.hour12 ? "hh:mm A" : "HH:mm"
	};
}

i18next.on("languageChanged", (lng) => {
	dayjs.locale(lng);
});

if(!appConfig.locale.language)
	appConfig.locale.language = getSupportedLanguageFromNavigator() || "en";

await i18next.init({
	lng: appConfig.locale.language,
	fallbackLng: "en",
	interpolation: {
		escapeValue: false
	}
});

// Import our resource bundles
for(const [{ lang, ns }, translation] of translations.entries())
	i18next.addResourceBundle(lang, ns, translation);

// At the end, import DayJS languages
for(const lang of new Set(translations.keys().map(x => x.lang))){
	try {
		await import(`dayjs/locale/${lang.toLowerCase()}`);
	}catch(_e){
		try {
			await import(`../../translations/${lang}/dayjs`);
		}catch(_e){
			console.error("DayJS does not have this locale and we don't have a replacement for that", lang);
		}
	}
}

dayjs.extend(LocalizedFormat);
dayjs.extend(RelativeTime);
dayjs.extend(Duration);
dayjs.extend(UTC);
dayjs.locale(i18next.language);

watch(appConfig, async () => {
	await i18next.changeLanguage(appConfig.locale.language);
});

export default i18next;
