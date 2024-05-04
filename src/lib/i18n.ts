import i18next from "i18next";

const translations = import.meta.glob("../../translations/*/*.json");

const loadTranslations = [
	"en"
];

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