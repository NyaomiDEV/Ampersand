import { getConfigEntry } from "./config";
import { AccessibilityConfig } from "./config/types";

export function getIonicMode(): "ios" | "md" {
	if (typeof (window as any) !== "undefined") {
		const Ionic = (window as any).Ionic;
		if (Ionic && Ionic.config) {
			return Ionic.config.get("mode");
		}
	}
	return "md";
}

export function isIOSIonicMode(): boolean {
	return getIonicMode() === "ios";
}

export function isDarkMode() {
	const accessibility = getConfigEntry("accessibility") as AccessibilityConfig;
	switch (accessibility.theme) {
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

export function updateAccessibility() {
	const highLegibility = (getConfigEntry("accessibility") as AccessibilityConfig).highLegibility;
	if (highLegibility) {
		document.documentElement.classList.add("high-legibility");

		const highLegibilityType = (getConfigEntry("accessibility") as AccessibilityConfig).highLegibilityType;

		switch(highLegibilityType){
			default:
			case "atkinson":
				document.documentElement.classList.remove("opendyslexic");
				document.documentElement.classList.add("atkinson");
				break;
			case "opendyslexic":
				document.documentElement.classList.remove("atkinson");
				document.documentElement.classList.add("opendyslexic");
				break;
		}
	} else
		document.documentElement.classList.remove("high-legibility", "atkinson", "opendyslexic");

	const fontScale = (getConfigEntry("accessibility") as AccessibilityConfig).fontScale;
	if (fontScale !== 1)
		document.documentElement.style.setProperty("font-size", `${fontScale}em`);
	else
		document.documentElement.style.removeProperty("font-size");

}