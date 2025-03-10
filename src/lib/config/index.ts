import { reactive, watch } from "vue";
import { AccessibilityConfig, AppConfig, SecurityConfig } from "./types";
import { isIOSIonicMode, updateAccessibility, updateDarkMode, updatePWATitlebarColor } from "../mode";
import { activateMaterialTheme, deactivateMaterialTheme, defaultColor, unsetMaterialColors, updateMaterialColors } from "../theme";
import i18next from "i18next";

const defaultAppConfig: AppConfig = {
	locale: {
		firstWeekOfDayIsSunday: false,
		twelveHourClock: false,
	},
	showSystemDescriptionInDashboard: false,
	view: "dashboard",
	defaultFilterQueries: {
		members: "@archived:no"
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
	fontScale: 1,
	chatFontScale: 1,
	longPressDuration: 750
}

const defaultSecurityConfig: SecurityConfig = {
	usePassword: false,
	password: undefined,
	useBiometrics: false
}

const impl = await ("isTauri" in window ? import('./impl/tauri') : import('./impl/localStorage'));

export const appConfig = reactive<AppConfig>({...structuredClone(defaultAppConfig), ...await impl.get("appConfig") });
export const accessibilityConfig = reactive<AccessibilityConfig>({ ...structuredClone(defaultAccessibilityConfig), ...await impl.get("accessibilityConfig") });
export const securityConfig = reactive<SecurityConfig>({ ...structuredClone(defaultSecurityConfig), ...await impl.get("securityConfig") });


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
	await impl.set("appConfig", { ...appConfig });
	i18next.changeLanguage(appConfig.locale.language);
});

watch(accessibilityConfig, async () => {
	await impl.set("accessibilityConfig", { ...accessibilityConfig });
	updateDarkMode();

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
	await impl.set("securityConfig", { ...securityConfig });
});
