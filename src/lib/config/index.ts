import { reactive, watch } from "vue";
import { AccessibilityConfig, AppConfig, SecurityConfig } from "./types";
import { isIOSIonicMode, updateAccessibility, updateDarkMode, updatePWATitlebarColor } from "../mode";
import { activateMaterialTheme, deactivateMaterialTheme, defaultColor, unsetMaterialColors, updateMaterialColors } from "../theme";
import i18next from "i18next";
import { Typeson } from "typeson";
import { blob, file, filelist, map, typedArrays, undef, set as Tset, imagebitmap, imagedata } from "typeson-registry";
import { load } from "@tauri-apps/plugin-store";
import { appConfigDir, sep } from "@tauri-apps/api/path";

const typeson = new Typeson({
	sync: true
}).register([
	file,
	filelist,
	blob,
	typedArrays,
	undef,
	map,
	Tset,
	imagebitmap,
	imagedata
]);

const defaultAppConfig: AppConfig = {
	locale: {
		firstWeekOfDayIsSunday: false,
		twelveHourClock: false,
	},
	showSystemDescriptionInDashboard: false,
	showMembersBeforeCustomFronts: true,
	hideFrontingTimer: false,
	useIPC: false,
	view: "dashboard",
	defaultFilterQueries: {
		members: "@archived:no",
		messageBoard: "@archived:no"
	}
};

const defaultAccessibilityConfig: AccessibilityConfig = {
	highLegibility: false,
	highLegibilityType: "atkinson",
	theme: "auto",
	useMaterialTheming: false,
	useAccentColor: false,
	accentColor: isIOSIonicMode() ? defaultColor : undefined,
	reducedMotion: false,
	disableMemberCoversInList: false,
	fontScale: 1,
	longPressDuration: 750
};

const defaultSecurityConfig: SecurityConfig = {
	usePassword: false,
	password: undefined,
	useBiometrics: false
};

const store = await load(await appConfigDir() + sep() + "appConfig.json");
export const appConfig = reactive<AppConfig>({...structuredClone(defaultAppConfig), ...await get("appConfig") });
export const accessibilityConfig = reactive<AccessibilityConfig>({ ...structuredClone(defaultAccessibilityConfig), ...await get("accessibilityConfig") });
export const securityConfig = reactive<SecurityConfig>({ ...structuredClone(defaultSecurityConfig), ...await get("securityConfig") });

export function set(key: string, value: unknown): Promise<void> {
	return store.set(key, typeson.encapsulate(value));
}

export async function get(key: string): Promise<object | undefined> {
	const value: unknown = await store.get(key);

	try {
		if (typeof value !== "undefined" && value !== null) 
			return typeson.revive(value) as object;
		
	} catch (e) {
		console.error(e, value);
	}

	return undefined;
}

export function resetConfig(){
	for(const key of Object.getOwnPropertyNames(appConfig))
		delete appConfig[key];

	for (const key of Object.getOwnPropertyNames(accessibilityConfig))
		delete accessibilityConfig[key];

	for (const key of Object.getOwnPropertyNames(securityConfig))
		delete securityConfig[key];

	Object.assign(appConfig, structuredClone(defaultAppConfig));
	Object.assign(accessibilityConfig, structuredClone(defaultAccessibilityConfig));
	Object.assign(securityConfig, structuredClone(defaultSecurityConfig));
}

watch(appConfig, async () => {
	await set("appConfig", { ...appConfig });
	await i18next.changeLanguage(appConfig.locale.language);
});

watch(accessibilityConfig, async () => {
	await set("accessibilityConfig", { ...accessibilityConfig });
	await updateDarkMode();

	if(isIOSIonicMode()){
		if(accessibilityConfig.useMaterialTheming)
			activateMaterialTheme();
		else {
			deactivateMaterialTheme();
			unsetMaterialColors();
		}
	}

	updateMaterialColors();
	updatePWATitlebarColor(window.getComputedStyle(document.body).getPropertyValue("--ion-toolbar-background"));
	updateAccessibility();
});

watch(securityConfig, async () => {
	await set("securityConfig", { ...securityConfig });
});
