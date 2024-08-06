import { reactive, watch } from "vue";
import { get, set } from "./localStorage";
import { AccessibilityConfig, AppConfig, SecurityConfig } from "./types";
import { updateAccessibility, updateDarkMode } from "../mode";
import { updateMaterialColors } from "../theme";

const defaultAppConfig: AppConfig = {
	locale: {
		language: "en",
		firstWeekOfDayIsSunday: false,
		twelveHourClock: false,
	},
	view: "members",
	defaultFilterQueries: {}
};

const defaultAccessibilityConfig: AccessibilityConfig = {
	highLegibility: false,
	highLegibilityType: "atkinson",
	theme: "auto",
	useAccentColor: false,
	accentColor: undefined,
	reducedMotion: false,
	fontScale: 1,
	chatFontScale: 1,
	longPressDuration: 750
}

const defaultSecurityConfig: SecurityConfig = {
	usePin: false,
	pinCode: undefined,
	useBiometrics: false
}

export const appConfig = reactive<AppConfig>({...defaultAppConfig, ...get("appConfig") });
export const accessibilityConfig = reactive<AccessibilityConfig>({ ...defaultAccessibilityConfig, ...get("accessibilityConfig") });
export const securityConfig = reactive<SecurityConfig>({ ...defaultSecurityConfig, ...get("securityConfig") });

watch(appConfig, () => set("appConfig", {...appConfig}));
watch(accessibilityConfig, () => {
	set("accessibilityConfig", { ...accessibilityConfig });
	updateDarkMode();
	updateMaterialColors();
	updateAccessibility();
});
watch(securityConfig, () => set("securityConfig", { ...securityConfig }));
