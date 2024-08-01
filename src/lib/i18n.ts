import dayjs from "dayjs";
import i18next from "i18next";

import "dayjs/locale/en";

const translations = import.meta.glob("../../translations/*/*.json");

const loadTranslations = [
	"en"
];

i18next.on("languageChanged", async (lng) => {
	dayjs.locale(lng);
})

await i18next.init({
	fallbackLng: "en",
	lowerCaseLng: true,
});

for(const path in translations){
	const [, lang, ns] = /\/translations\/(.*)\/(.*)\.json$/.exec(path)!;
	if(!loadTranslations.includes(lang)) continue;
	
	i18next.addResourceBundle(lang, ns, await translations[path]())
}

export default i18next;