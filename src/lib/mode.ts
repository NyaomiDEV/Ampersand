import { M3 } from "tauri-plugin-m3";
import { accessibilityConfig } from "./config";

export function getIonicMode(): "ios" | "md" {
	if (window.Ionic && window.Ionic.config) {
		return window.Ionic.config.get("mode");
	}
	return "md";
}

export function isIOSIonicMode(): boolean {
	return getIonicMode() === "ios";
}

export function isMobile(){
	return window.matchMedia('(any-pointer:coarse)').matches;
}

function testUserAgent(regex: RegExp) {
	return regex.test(window.navigator.userAgent);
}

export function isIOS(){
	return testUserAgent(/iPhone|iPod|iPad/i) || (isMobile() && testUserAgent(/Macintosh/i))
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

export function updatePWATitlebarColor(color: string){
	const query = document.head.querySelector('meta[name="theme-color"]')
	if(query) {
		query.setAttribute("content", color);
		return;
	}

	const themeMeta = document.createElement("meta");
	themeMeta.setAttribute("name", "theme-color");
	themeMeta.setAttribute("content", color);
	document.head.appendChild(themeMeta);
}

export async function updateDarkMode() {
	document.documentElement.classList.toggle("ion-palette-dark", isDarkMode());
	updatePWATitlebarColor(window.getComputedStyle(document.body).getPropertyValue("--ion-toolbar-background"));
	await M3.setBarColor(isDarkMode() ? "light" : "dark");
}

export async function updateInsets() {
	const insets = await M3.getInsets();
	if(insets && !('error' in insets)){
		document.documentElement.style.setProperty("--device-inset-top", Number(insets.adjustedInsetTop) + "px");
		document.documentElement.style.setProperty("--device-inset-left", Number(insets.adjustedInsetLeft) + "px");
		document.documentElement.style.setProperty("--device-inset-right", Number(insets.adjustedInsetRight) + "px");
		document.documentElement.style.setProperty("--device-inset-bottom", Number(insets.adjustedInsetBottom) + "px");
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

	window.Ionic.config.set("animated", !accessibilityConfig.reducedMotion);

	const fontScale = accessibilityConfig.fontScale;
	if (fontScale !== 1)
		document.documentElement.style.setProperty("font-size", `${fontScale}em`);
	else
		document.documentElement.style.removeProperty("font-size");
}
