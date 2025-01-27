import { reactive, watch } from "vue";
import { AccessibilityConfig, AppConfig, SecurityConfig } from "./types";
import { isIOSIonicMode, updateAccessibility, updateDarkMode } from "../mode";
import { activateMaterialTheme, deactivateMaterialTheme, defaultColor, unsetMaterialColors, updateMaterialColors } from "../theme";
import i18next from "i18next";

const defaultAppConfig: AppConfig = {
	locale: {
		firstWeekOfDayIsSunday: false,
		twelveHourClock: false,
	},
	view: "dashboard",
	defaultFilterQueries: {
		members: "@archived:no"
	}
};

const defaultAccessibilityConfig: AccessibilityConfig = {
	highLegibility: false,
	highLegibilityType: "atkinson",
	theme: "auto",
	useMaterialTheming: isIOSIonicMode(),
	useAccentColor: !isIOSIonicMode(),
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

export const appConfig = reactive<AppConfig>({...defaultAppConfig, ...await impl.get("appConfig") });
export const accessibilityConfig = reactive<AccessibilityConfig>({ ...defaultAccessibilityConfig, ...await impl.get("accessibilityConfig") });
export const securityConfig = reactive<SecurityConfig>({ ...defaultSecurityConfig, ...await impl.get("securityConfig") });

watch(appConfig, async () => {
	await impl.set("appConfig", {...appConfig});
	i18next.changeLanguage(appConfig.locale.language);
});

watch(accessibilityConfig, async () => {
	await impl.set("accessibilityConfig", { ...accessibilityConfig });
	updateDarkMode();

	if(isIOSIonicMode())
		if(accessibilityConfig.useMaterialTheming)
			activateMaterialTheme();
		else {
			deactivateMaterialTheme();
			unsetMaterialColors();
		}

	updateMaterialColors();
	updateAccessibility();
});

watch(securityConfig, async () => {
	await impl.set("securityConfig", { ...securityConfig });
});
