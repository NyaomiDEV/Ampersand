import { argbFromHex, blueFromArgb, greenFromArgb, Hct, MaterialDynamicColors, redFromArgb, SchemeFidelity, SchemeTonalSpot } from "@material/material-color-utilities";
import { accessibilityConfig } from "../config";
import { M3 } from "tauri-plugin-m3";
import { platform } from "@tauri-apps/plugin-os";
import { isDarkMode as calculateDarkMode } from "../mode";

const customColorsWeWant = [
	"primary",
	"on_primary",
	"primary_container",
	"on_primary_container"
];

const defaultColor = "#30628C";
const systemColor = await (async () => {
	if(platform() === "android"){
		const colors = await M3.getColors("system");
		if(colors) return colors.primaryContainer;
	}
	return undefined;
})();

function rgbFromArgb(argb: number){
	return [
		redFromArgb(argb),
		greenFromArgb(argb),
		blueFromArgb(argb)
	].join(", ");
}

function calculateHex(){
	const useAccentColor = accessibilityConfig.useAccentColor;
	const accentColor = accessibilityConfig.accentColor;
	return useAccentColor && accentColor
		? rgbaToArgb(accentColor)
		: (systemColor ? rgbaToArgb(systemColor) : defaultColor);
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
	addMaterialColors(undefined, target);
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

export function getMaterialColors(hex?: string, isDarkMode?: boolean){
	if (!hex) hex = calculateHex();
	if (!isDarkMode) isDarkMode = calculateDarkMode();

	const schemeVariant = accessibilityConfig.themeIsVibrant ? SchemeFidelity : SchemeTonalSpot;
	const scheme = new schemeVariant(
		Hct.fromInt(argbFromHex(hex)),
		isDarkMode,
		accessibilityConfig.contrastLevel,
		"2025",
		"phone"
	);

	const styleSheet: Map<string, number> = new Map();
	const colors = new MaterialDynamicColors();

	for (const dynamicColor of colors.allColors)
		styleSheet.set(dynamicColor.name, dynamicColor.getArgb(scheme));

	// Add colors that they forgot
	styleSheet.set("shadow", colors.shadow().getArgb(scheme));
	styleSheet.set("scrim", colors.scrim().getArgb(scheme));
	styleSheet.set("surface_tint", colors.surfaceTint().getArgb(scheme));


	if (isDarkMode && accessibilityConfig.themeIsAmoled) {
		styleSheet.set("background", argbFromHex("#000"));
		styleSheet.set("surface", argbFromHex("#000"));
		styleSheet.set("on_background", argbFromHex("#fff"));
		styleSheet.set("on_surface", argbFromHex("#fff"));
	}

	return styleSheet;
}

export function getPaletteTones(hex?: string, isDarkMode?: boolean){
	if (!hex) hex = calculateHex();
	if (!isDarkMode) isDarkMode = calculateDarkMode();

	const paletteTones: Map<number, number> = new Map();
	const schemeVariant = accessibilityConfig.themeIsVibrant ? SchemeFidelity : SchemeTonalSpot;
	const scheme = new schemeVariant(
		Hct.fromInt(argbFromHex(hex)),
		isDarkMode || false,
		accessibilityConfig.contrastLevel,
		"2025",
		"phone"
	);
	for (let i = 5; i <= 100; i += 5) 
		paletteTones.set(i, scheme.neutralPalette.tone(i));

	return paletteTones;
}

export function addMaterialColors(hex?: string, target?: HTMLElement){
	const styleSheet: Map<string, string> = new Map();
	for(const uiMode of ["light", "dark"]){
		const palette = getMaterialColors(hex, uiMode === "dark");
		const paletteSuccess = getMaterialColors("#00ff00", uiMode === "dark");
		const paletteWarning = getMaterialColors("#ffff00", uiMode === "dark");

		for (const [key, value] of palette.entries()){
			styleSheet.set(
				`--md3-${uiMode}-${key.replaceAll("_", "-")}`,
				rgbFromArgb(value)
			);
		}

		for (const key of customColorsWeWant) {
			styleSheet.set(
				`--md3-${uiMode}-${key
					.replaceAll("_", "-")
					.replace("primary", "success")}`,
				rgbFromArgb(paletteSuccess.get(key)!)
			);
			styleSheet.set(
				`--md3-${uiMode}-${key
					.replaceAll("_", "-")
					.replace("primary", "warning")}`,
				rgbFromArgb(paletteWarning.get(key)!)
			);
		}
	}
	const tones = getPaletteTones(hex, false);

	for (const [i, value] of tones.entries()) {
		styleSheet.set(
			`--md3-neutral-palette-tone-${i}`,
			rgbFromArgb(value)
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
