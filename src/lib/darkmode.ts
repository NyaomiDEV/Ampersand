import { getConfigEntry } from "./config";
import { AccessibilityConfig } from "./config/types";

export function isDarkMode(){
	const accessibility = getConfigEntry("accessibility") as AccessibilityConfig;
	switch(accessibility.theme){
		case "dark":
			return true;
		case "light":
			return false;
		case "auto":
			return window.matchMedia('(prefers-color-scheme: dark)').matches;
	}
}

export function updateDarkMode() {
	document.documentElement.classList.toggle("ion-palette-dark", isDarkMode());
}
