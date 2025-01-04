import { getOffsets } from "tauri-plugin-m3";
import { accessibilityConfig } from "./config";

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
	switch (accessibilityConfig.theme) {
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

export async function updateInsets() {
	if(!('isTauri' in window)) return;

	const offsets = await getOffsets();
	if(offsets){
		document.documentElement.style.setProperty("--device-offset-top", Number(offsets.top) / devicePixelRatio + "px");
		document.documentElement.style.setProperty("--device-offset-left", Number(offsets.left) / devicePixelRatio + "px");
		document.documentElement.style.setProperty("--device-offset-right", Number(offsets.right) / devicePixelRatio + "px");
		document.documentElement.style.setProperty("--device-offset-bottom", Number(offsets.bottom) / devicePixelRatio + "px");
	}
}

export function updateAccessibility() {
	const highLegibility = accessibilityConfig.highLegibility;
	if (highLegibility) {
		document.documentElement.classList.add("high-legibility");

		const highLegibilityType = accessibilityConfig.highLegibilityType;

		document.documentElement.classList.remove(...[...document.documentElement.classList.values()].filter(x => x.startsWith("hl-")));
		document.documentElement.classList.add("hl-" + highLegibilityType);
	} else
		document.documentElement.classList.remove("high-legibility", ...[...document.documentElement.classList.values()].filter(x => x.startsWith("hl-")));

	const fontScale = accessibilityConfig.fontScale;
	if (fontScale !== 1)
		document.documentElement.style.setProperty("font-size", `${fontScale}em`);
	else
		document.documentElement.style.removeProperty("font-size");

}
