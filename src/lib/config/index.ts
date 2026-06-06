import { reactive, toRaw, watch, WatchStopHandle } from "vue";
import type { AccessibilityConfig, AppConfig, SecurityConfig } from "./types";
import { debounce, merge } from "./utils";
import { defaultAccessibilityConfig, defaultAppConfig, defaultSecurityConfig } from "./defaults";
import { getConfig, saveConfig } from "./store";
import { deleteOldConfig, readOldConfig } from "./old";

export const appConfig = reactive({}) as AppConfig;
export const accessibilityConfig = reactive({}) as AccessibilityConfig;
export const securityConfig = reactive({}) as SecurityConfig;

export const initConfig = (() => {
	const watchers: WatchStopHandle[] = [];
	async function initConfig(configOverrides?: { appConfig?: Partial<AppConfig>, accessibilityConfig?: Partial<AccessibilityConfig>, securityConfig?: Partial<SecurityConfig> }) {
		// stop watchers if any
		watchers.forEach(x => x());
		watchers.length = 0;

		for (const key of Object.keys(appConfig))
			delete appConfig[key];

		for (const key of Object.keys(accessibilityConfig))
			delete accessibilityConfig[key];

		for (const key of Object.keys(securityConfig))
			delete securityConfig[key];

		const _config = {
			appConfig: configOverrides?.appConfig,
			accessibilityConfig: configOverrides?.accessibilityConfig,
			securityConfig: configOverrides?.securityConfig
		};

		if(!_config.appConfig)
			_config.appConfig = await getConfig<AppConfig>("appConfig") || {};

		if(!_config.accessibilityConfig)
			_config.accessibilityConfig = await getConfig<AccessibilityConfig>("accessibilityConfig") || {};
	
		if(!_config.securityConfig)
			_config.securityConfig = await getConfig<SecurityConfig>("securityConfig") || {};

		Object.assign(appConfig, merge<AppConfig>(structuredClone(defaultAppConfig), _config.appConfig));
		Object.assign(accessibilityConfig, merge<AccessibilityConfig>(structuredClone(defaultAccessibilityConfig), _config.accessibilityConfig));
		Object.assign(securityConfig, merge<SecurityConfig>({}, structuredClone(defaultSecurityConfig), _config.securityConfig));

		// save configuration as per init values
		await saveApp();
		await saveAccessibility();
		await saveSecurity();

		// debounced save delegates
		const timeout = 1000;

		const debouncedSaveApp = debounce(saveApp, timeout);
		const debouncedSaveAccessibility = debounce(saveAccessibility, timeout);
		const debouncedSaveSecurity = debounce(saveSecurity, timeout);

		// set up watchers
		watchers.push(
			watch(appConfig, debouncedSaveApp),
			watch(accessibilityConfig, debouncedSaveAccessibility),
			watch(securityConfig, debouncedSaveSecurity),
		);
	}

	return initConfig;
})();

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
const maybeOldConfig = await readOldConfig();
if(maybeOldConfig){
	await initConfig(maybeOldConfig);
	await deleteOldConfig();
}

async function saveApp(){
	await saveConfig("appConfig", structuredClone(toRaw(appConfig)));
}

async function saveAccessibility() {
	await saveConfig("accessibilityConfig", structuredClone(toRaw(accessibilityConfig)));
}

async function saveSecurity() {
	await saveConfig("securityConfig", structuredClone(toRaw(securityConfig)));
}
