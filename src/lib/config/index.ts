import { getCompound, setCompound } from "../util/localStorage";
import { Config } from "./types";

export const defaultConfig: Config = {
	app: {
		locale: {
			language: "en",
			firstWeekOfDayIsMonday: true,
			TwelveHourClock: false,
		},
		view: "members",
		filterQueryMembers: "",
		filterQueryJournal: ""
	},
	accessibility: {
		highLegibility: false,
		highLegibilityType: "atkinson",
		theme: "auto",
		useAccentColor: false,
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
