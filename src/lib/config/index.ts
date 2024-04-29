import { getCompound, setCompound } from "../util/localstorage";
import { Config } from "./types";

export const defaultConfig: Config = {
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
		uiScale: 1
	},
	security: {
		pinCode: undefined,
		useBiometrics: false
	}
};

export function getConfig(): Config {
	return Object.assign({}, defaultConfig, getCompound("config"));
}

export function saveConfig(config: Partial<Config>) {
	return setCompound("config", config);
}
