import { argbFromHex, blueFromArgb, greenFromArgb, Hct, MaterialDynamicColors, redFromArgb, SchemeFidelity, SchemeTonalSpot } from "@material/material-color-utilities";
import { accessibilityConfig } from "../config";
import { M3 } from "tauri-plugin-m3";
import { platform } from "@tauri-apps/plugin-os";

const customColorsWeWant = [
	"primary",
	"on_primary",
	"primary_container",
	"on_primary_container"
];

const defaultColor = "#30628C";

const m3colors = platform() === "android" ? await M3.getColors("system") : false;

function rgbFromArgb(argb: number){
	return [
		redFromArgb(argb),
		greenFromArgb(argb),
		blueFromArgb(argb)
	].join(", ");
}

export function rgbaToArgb(rgba: string) {
	const matches = rgba.replace("#", "").match(/.{1,2}/g);

	if(!matches) return rgba;
	const [ r, g, b, a ] = matches;
	if(!a)
		return `#${r + g + b}`;

	// else it does
	return `#${a + r + g + b}`;
}

export function updateMaterialColors(target?: HTMLElement){
	const useAccentColor = accessibilityConfig.useAccentColor;
	const accentColor = accessibilityConfig.accentColor;
	if (useAccentColor && accentColor)
		addMaterialColors(rgbaToArgb(accentColor), target);
	else if(m3colors && m3colors.primaryContainer)
		addMaterialColors(rgbaToArgb(m3colors.primaryContainer), target);
	else
		addMaterialColors(defaultColor, target);
}

export function unsetMaterialColors(target?: HTMLElement){
	// Clean up
	if(target) {
		return Array.from(target.style)
			.filter(x => x.startsWith("--md3"))
			.forEach(x => target.style.removeProperty(x));
	}

	return Array.from(document.documentElement.style)
		.filter(x => x.startsWith("--md3"))
		.forEach(x => document.documentElement.style.removeProperty(x));
}

export function getMaterialColors(hex: string, isDarkMode: boolean){
	const schemeVariant = accessibilityConfig.themeIsVibrant ? SchemeFidelity : SchemeTonalSpot;
	const scheme = new schemeVariant(
		Hct.fromInt(argbFromHex(hex)),
		isDarkMode,
		accessibilityConfig.contrastLevel,
		"2025",
		"phone"
	);

	const styleSheet: Map<string, string> = new Map();
	const colors = new MaterialDynamicColors();

	for (const dynamicColor of colors.allColors)
		styleSheet.set(dynamicColor.name, rgbFromArgb(dynamicColor.getArgb(scheme)));

	// Add colors that they forgot
	styleSheet.set("shadow", rgbFromArgb(colors.shadow().getArgb(scheme)));
	styleSheet.set("scrim", rgbFromArgb(colors.scrim().getArgb(scheme)));
	styleSheet.set("surface_tint", rgbFromArgb(colors.surfaceTint().getArgb(scheme)));


	if (isDarkMode && accessibilityConfig.themeIsAmoled) {
		styleSheet.set("background", "0, 0, 0");
		styleSheet.set("surface", "0, 0, 0");
		styleSheet.set("on_background", "255, 255, 255");
		styleSheet.set("on_surface", "255, 255, 255");
	}

	return styleSheet;
}

export function getPaletteTones(hex: string, isDarkMode: boolean){
	const paletteTones: Map<number, string> = new Map();
	const schemeVariant = accessibilityConfig.themeIsVibrant ? SchemeFidelity : SchemeTonalSpot;
	const scheme = new schemeVariant(
		Hct.fromInt(argbFromHex(hex)),
		isDarkMode,
		accessibilityConfig.contrastLevel,
		"2025",
		"phone"
	);
	for (let i = 5; i <= 100; i += 5) 
		paletteTones.set(i, rgbFromArgb(scheme.neutralPalette.tone(i)));

	return paletteTones;
}

export function addMaterialColors(hex: string, target?: HTMLElement){
	const styleSheet: Map<string, string> = new Map();
	for(const uiMode of ["light", "dark"]){
		const palette = getMaterialColors(hex, uiMode === "dark");
		const paletteSuccess = getMaterialColors("#00ff00", uiMode === "dark");
		const paletteWarning = getMaterialColors("#ffff00", uiMode === "dark");

		for (const [key, value] of palette.entries()){
			styleSheet.set(
				`--md3-${uiMode}-${key.replaceAll("_", "-")}`,
				value
			);
		}

		for (const key of customColorsWeWant) {
			styleSheet.set(
				`--md3-${uiMode}-${key
					.replaceAll("_", "-")
					.replace("primary", "success")}`,
				paletteSuccess.get(key)!
			);
			styleSheet.set(
				`--md3-${uiMode}-${key
					.replaceAll("_", "-")
					.replace("primary", "warning")}`,
				paletteWarning.get(key)!
			);
		}
	}
	const tones = getPaletteTones(hex, false);

	for (const [i, value] of tones.entries()) {
		styleSheet.set(
			`--md3-neutral-palette-tone-${i}`,
			value
		);
	}

	if(target) {
		for(const [key, value] of styleSheet)
			target.style.setProperty(key, value);

		return;
	}

	for (const [key, value] of styleSheet)
		document.documentElement.style.setProperty(key, value);
}
