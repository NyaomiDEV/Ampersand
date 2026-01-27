import { reactive, watch } from "vue";
import type { AccessibilityConfig, AppConfig, SecurityConfig } from "./types";
import { load } from "@tauri-apps/plugin-store";
import { appConfigDir, sep } from "@tauri-apps/api/path";
import { nilUid } from "../util/consts";

const defaultAppConfig: AppConfig = {
	locale: {
		language: navigator.language,
		firstWeekOfDayIsSunday: false,
		twelveHourClock: false,
	},
	defaultSystem: nilUid,
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
	useAccentColor: false,
	accentColor: "#30628C",
	reducedMotion: false,
	disableMemberCoversInList: false,
	contrastLevel: 0,
	fontScale: 1,
	longPressDuration: 750
};

const defaultSecurityConfig: SecurityConfig = {
	usePassword: false,
	password: undefined,
	useBiometrics: false,
	allowRemoteContent: false
};

const store = await load(`${await appConfigDir() + sep()}appConfig.json`);
const appConfig = reactive<AppConfig>({ ...structuredClone(defaultAppConfig), ...await get("appConfig") });
const accessibilityConfig = reactive<AccessibilityConfig>({ ...structuredClone(defaultAccessibilityConfig), ...await get("accessibilityConfig") });
const securityConfig = reactive<SecurityConfig>({ ...structuredClone(defaultSecurityConfig), ...await get("securityConfig") });

export function set(key: string, value: unknown): Promise<void> {
	return store.set(key, value);
}

export async function get(key: string): Promise<object | undefined> {
	try {
		return await store.get(key);
	} catch (e) {
		console.error(e, key);
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
});

watch(accessibilityConfig, async () => {
	await set("accessibilityConfig", { ...accessibilityConfig });
});

watch(securityConfig, async () => {
	await set("securityConfig", { ...securityConfig });
});

export {
	appConfig,
	accessibilityConfig,
	securityConfig
};