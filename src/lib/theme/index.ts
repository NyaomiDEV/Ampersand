import { argbFromHex, blueFromArgb, greenFromArgb, redFromArgb, themeFromSourceColor } from "@material/material-color-utilities";
import { getConfigEntry } from "../config";
import { AccessibilityConfig } from "../config/types";

function rgbFromArgb(argb: number){
	return [
		redFromArgb(argb),
		greenFromArgb(argb),
		blueFromArgb(argb)
	].join(", ");
}

export function updateMaterialColors(target?: HTMLElement){
	const useAccentColor = (getConfigEntry("accessibility") as AccessibilityConfig).useAccentColor;
	const accentColor = (getConfigEntry("accessibility") as AccessibilityConfig).accentColor;
	if (useAccentColor && accentColor)
		addMaterialColors(accentColor, target);
	else
		addMaterialColors("#7E5700", target);
}

export function activateMaterialTheme(target?: HTMLElement) {
	(target ?? document.documentElement).classList.add("md3");
}

export function deactivateMaterialTheme(target?: HTMLElement) {
	(target ?? document.documentElement).classList.remove("md3");
}

export function unsetMaterialColors(target?: HTMLElement){
	// Clean up
	Array.from((target ?? document.documentElement).style)
		.filter(x => x.startsWith("--md3"))
		.forEach(x => (target ?? document.documentElement).style.removeProperty(x));
}

export function addMaterialColors(hex: string, target?: HTMLElement){
	// Generate new theme
	const theme = themeFromSourceColor(argbFromHex(hex));

	for (const [key, value] of Object.entries(theme.schemes.dark.toJSON())) {
		const token = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
		const color = rgbFromArgb(value);
		(target ?? document.documentElement).style.setProperty(`--md3-dark-${token}`, color);
	}

	for (const [key, value] of Object.entries(theme.schemes.light.toJSON())) {
		const token = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
		const color = rgbFromArgb(value);
		(target ?? document.documentElement).style.setProperty(`--md3-light-${token}`, color);
	}

	const extraTones = [99, 98, 11, 12];

	for (let i = 0; i <= 100; i += 5) {
		const color = rgbFromArgb(theme.palettes.neutral.tone(i));
		(target ?? document.documentElement).style.setProperty(`--md3-shade-${i}`, color);
	}

	for (const i of extraTones){
		const color = rgbFromArgb(theme.palettes.neutral.tone(i));
		(target ?? document.documentElement).style.setProperty(`--md3-shade-${i}`, color);
	}
}
