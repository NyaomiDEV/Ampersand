import { reactive, toRaw, watch } from "vue";
import type { AccessibilityConfig, AppConfig, SecurityConfig } from "./types";
import { debounce, merge } from "./utils";
import { defaultAccessibilityConfig, defaultAppConfig, defaultSecurityConfig } from "./defaults";
import { getConfig, saveConfig } from "./store";
import { deleteOldConfig, readOldConfig } from "./old";

export const appConfig = reactive({}) as AppConfig;
export const accessibilityConfig = reactive({}) as AccessibilityConfig;
export const securityConfig = reactive({}) as SecurityConfig;

export async function initConfig(){
	for (const key of Object.keys(appConfig))
		delete appConfig[key];

	for (const key of Object.keys(accessibilityConfig))
		delete accessibilityConfig[key];

	for (const key of Object.keys(securityConfig))
		delete securityConfig[key];

	const _config = {
		appConfig: {},
		accessibilityConfig: {},
		securityConfig: {}
	};

	const maybeOldConfig = await readOldConfig();
	if(maybeOldConfig){
		await saveConfig("appConfig", maybeOldConfig.appConfig);
		await saveConfig("accessibilityConfig", maybeOldConfig.accessibilityConfig);
		await saveConfig("securityConfig", maybeOldConfig.securityConfig);
		await deleteOldConfig();

		_config.appConfig = maybeOldConfig.appConfig;
		_config.accessibilityConfig = maybeOldConfig.accessibilityConfig;
		_config.securityConfig = maybeOldConfig.securityConfig;
	} else {
		_config.appConfig = await getConfig<AppConfig>("appConfig") || {};
		_config.accessibilityConfig = await getConfig<AccessibilityConfig>("accessibilityConfig") || {};
		_config.securityConfig = await getConfig<SecurityConfig>("securityConfig") || {};
	}

	Object.assign(appConfig, merge<AppConfig>(structuredClone(defaultAppConfig), _config.appConfig));
	Object.assign(accessibilityConfig, merge<AccessibilityConfig>(structuredClone(defaultAccessibilityConfig), _config.accessibilityConfig));
	Object.assign(securityConfig, merge<SecurityConfig>({}, structuredClone(defaultSecurityConfig), _config.securityConfig));
}

export function resetConfig(){
	for(const key of Object.keys(appConfig))
		delete appConfig[key];

	for (const key of Object.keys(accessibilityConfig))
		delete accessibilityConfig[key];

	for (const key of Object.keys(securityConfig))
		delete securityConfig[key];

	Object.assign(appConfig, structuredClone(defaultAppConfig));
	Object.assign(accessibilityConfig, structuredClone(defaultAccessibilityConfig));
	Object.assign(securityConfig, structuredClone(defaultSecurityConfig));
}

// init
await initConfig();

// debounced save delegates
const timeout = 1000;

const debouncedSaveApp = debounce(async () => {
	await saveConfig("appConfig", structuredClone(toRaw(appConfig)));
}, timeout);

const debouncedSaveAccessibility = debounce(async () => {
	await saveConfig("accessibilityConfig", structuredClone(toRaw(accessibilityConfig)));
}, timeout);

const debouncedSaveSecurity = debounce(async () => {
	await saveConfig("securityConfig", structuredClone(toRaw(securityConfig)));
}, timeout);

// watchers
watch(appConfig, debouncedSaveApp);
watch(accessibilityConfig, debouncedSaveAccessibility);
watch(securityConfig, debouncedSaveSecurity);