import { getCompound, setCompound } from "../util/localStorage";
import { Config } from "./types";

export const defaultConfig: Config = {
	currentSystemUUID: undefined,
	app: {
		language: "en",
		view: "dashboard",
		filterQueryMembers: "",
		filterQueryJournal: ""
	},
	accessibility: {
		highLegibility: false,
		theme: "auto",
		accentColor: undefined,
		reducedMotion: false,
		fontScale: 1,
		chatFontScale: 1
	},
	security: {
		pinCode: undefined,
		useBiometrics: false
	}
};

export function getConfig(): Config {
	return Object.assign({}, defaultConfig, getCompound("config"));
}

export function getConfigEntry(entryKey: keyof Config): Config[keyof Config] {
	return getConfig()[entryKey];
}

export function saveConfig(config: Partial<Config>) {
	return setCompound("config", config);
}
