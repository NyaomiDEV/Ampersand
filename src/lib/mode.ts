import { M3 } from "tauri-plugin-m3";
import { accessibilityConfig } from "./config";
import { platform } from "@tauri-apps/plugin-os";

export function isDarkMode() {
	switch (accessibilityConfig.theme) {
		case "dark":
			return true;
		case "light":
			return false;
		case "auto":
			return window.matchMedia("(prefers-color-scheme: dark)").matches;
	}
}

export async function updateDarkMode() {
	document.documentElement.classList.toggle("ion-palette-dark", isDarkMode());
	if(platform() === "android")
		await M3.setBarColor(isDarkMode() ? "light" : "dark");
}

export async function updateInsets() {
	if (platform() !== "android") return;
	const insets = await M3.getInsets();
	if(insets && !("error" in insets)) {
		document.documentElement.style.setProperty("--device-inset-top", `${Number(insets.adjustedInsetTop)}px`);
		document.documentElement.style.setProperty("--device-inset-left", `${Number(insets.adjustedInsetLeft)}px`);
		document.documentElement.style.setProperty("--device-inset-right", `${Number(insets.adjustedInsetRight)}px`);
		document.documentElement.style.setProperty("--device-inset-bottom", `${Number(insets.adjustedInsetBottom)}px`);
	}
}

export function updateAccessibility() {
	const highLegibility = accessibilityConfig.highLegibility;
	if (highLegibility) {
		document.documentElement.classList.add("high-legibility");

		const highLegibilityType = accessibilityConfig.highLegibilityType;

		document.documentElement.classList.remove(...[...document.documentElement.classList.values()].filter(x => x.startsWith("hl-")));
		document.documentElement.classList.add(`hl-${highLegibilityType}`);
	} else
		document.documentElement.classList.remove("high-legibility", ...[...document.documentElement.classList.values()].filter(x => x.startsWith("hl-")));

	window.Ionic.config.set("animated", !accessibilityConfig.reducedMotion);

	const fontScale = accessibilityConfig.fontScale;
	if (fontScale !== 1)
		document.documentElement.style.setProperty("font-size", `${fontScale}em`);
	else
		document.documentElement.style.removeProperty("font-size");
}
