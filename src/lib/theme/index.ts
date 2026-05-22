import { argbFromHex, blueFromArgb, DynamicScheme, greenFromArgb, Hct, redFromArgb, TonalPalette, Variant } from "@material/material-color-utilities";
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

const defaultPrimaryColor = "#30628C";
const defaultBackgroundColor = "#308C88";

const systemPrimaryColor = await (async () => {
	if(platform() === "android"){
		const colors = await M3.getColors("system");
		if(colors) return colors.primaryContainer;
	}
	return undefined;
})();
const systemBackgroundColor = await (async () => {
	if (platform() === "android") {
		const colors = await M3.getColors("system");
		if (colors) return colors.background;
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

function calculatePrimaryColor(){
	switch(accessibilityConfig.colors){
		case "app":
			return rgbaToArgb(defaultPrimaryColor);
		case "system":
			return rgbaToArgb(systemPrimaryColor || defaultPrimaryColor);
		case "custom":
			return rgbaToArgb(accessibilityConfig.customColors.accentColor || defaultPrimaryColor);
	}
}

function calculateBackgroundColor() {
	switch (accessibilityConfig.colors) {
		case "app":
			return rgbaToArgb(defaultBackgroundColor);
		case "system":
			return rgbaToArgb(systemBackgroundColor || defaultBackgroundColor);
		case "custom":
			return rgbaToArgb(accessibilityConfig.customColors.backgroundColor || defaultBackgroundColor);
	}
}

function isMonochrome(argb: number){
	return redFromArgb(argb) === greenFromArgb(argb) && greenFromArgb(argb) === blueFromArgb(argb);
}

function schemeFromAccessibilityConfig(){
	switch(accessibilityConfig.themeScheme){
		case "neutral":
			return Variant.NEUTRAL;
		case "tonal-spot":
			return Variant.TONAL_SPOT;
		case "vibrant":
			return Variant.VIBRANT;
		case "expressive":
			return Variant.EXPRESSIVE;
	}
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
	return addMaterialColors(undefined, undefined, target);
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

export function getScheme(primary?: string, neutral?: string, isDarkMode?: boolean){
	if (!primary) primary = calculatePrimaryColor();
	if (!neutral) neutral = calculateBackgroundColor();
	if (!isDarkMode) isDarkMode = calculateDarkMode();

	const primaryColorHct = Hct.fromInt(argbFromHex(primary));
	const neutralColorHct = Hct.fromInt(argbFromHex(neutral));

	const variant = schemeFromAccessibilityConfig();

	const primaryVariant = isMonochrome(argbFromHex(primary)) ? Variant.NEUTRAL : variant;
	const neutralVariant = isMonochrome(argbFromHex(neutral)) ? Variant.NEUTRAL : variant;

	return new DynamicScheme({
		isDark: isDarkMode,
		variant: primaryVariant,
		specVersion: "2025",
		platform: "phone",
		contrastLevel: accessibilityConfig.contrastLevel,
		sourceColorHct: primaryColorHct,
		neutralPalette: getNeutralPalette2025(neutralVariant, neutralColorHct, isDarkMode), // 2025 color spec
		neutralVariantPalette: getNeutralVariantPalette2025(neutralVariant, neutralColorHct, isDarkMode) // 2025 color spec
	});
}

export function getMaterialColors(primary?: string, secondary?: string, isDarkMode?: boolean){
	const scheme = getScheme(primary, secondary, isDarkMode);

	const styleSheet: Map<string, number> = new Map();

	for (const dynamicColor of scheme.colors.allColors)
		styleSheet.set(dynamicColor.name, dynamicColor.getArgb(scheme));

	// Add colors that they forgot
	styleSheet.set("shadow", scheme.colors.shadow().getArgb(scheme));
	styleSheet.set("scrim", scheme.colors.scrim().getArgb(scheme));
	styleSheet.set("surface_tint", scheme.colors.surfaceTint().getArgb(scheme));
	styleSheet.set("surface_variant", scheme.colors.surfaceVariant().getArgb(scheme));

	if (isDarkMode && accessibilityConfig.themeIsAmoled) {
		styleSheet.set("background", argbFromHex("#000"));
		styleSheet.set("surface", argbFromHex("#000"));
		styleSheet.set("on_background", argbFromHex("#fff"));
		styleSheet.set("on_surface", argbFromHex("#fff"));
	}

	return styleSheet;
}

export function getPaletteTones(primary?: string, neutral?: string, isDarkMode?: boolean){
	const paletteTones: Map<number, number> = new Map();
	const scheme = getScheme(primary, neutral, isDarkMode);
	for (let i = 5; i <= 100; i += 5) 
		paletteTones.set(i, scheme.neutralPalette.tone(i));

	return paletteTones;
}

export function addMaterialColors(primary?: string, neutral?: string, target?: HTMLElement){
	const styleSheet: Map<string, string> = new Map();
	for(const uiMode of ["light", "dark"]){
		const palette = getMaterialColors(primary, neutral, uiMode === "dark");
		const paletteSuccess = getMaterialColors("#00ff00", undefined, uiMode === "dark");
		const paletteWarning = getMaterialColors("#ffff00", undefined, uiMode === "dark");

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
	
	const tones = getPaletteTones(primary, neutral, false);

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

function getNeutralPalette2025(variant: Variant, sourceColorHct: Hct, isDark: boolean): TonalPalette | undefined {
	switch (variant) {
		case Variant.NEUTRAL:
			return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 1.4);
		case Variant.TONAL_SPOT:
			return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 5);
		case Variant.EXPRESSIVE: {
			const neutralHue = DynamicScheme.getRotatedHue(sourceColorHct, [0, 71, 124, 253, 278, 300, 360], [10, 0, 10, 0, 10, 0]);
			return TonalPalette.fromHueAndChroma(neutralHue,(isDark ? (Hct.isYellow(neutralHue) ? 6 : 14) : 18));
		}
		case Variant.VIBRANT: {
			const neutralHue = DynamicScheme.getRotatedHue(sourceColorHct, [0, 38, 105, 140, 333, 360], [-14, 10, -14, 10, -14]);
			return TonalPalette.fromHueAndChroma(neutralHue, 28);
		}
	}
	return undefined;
}

function getNeutralVariantPalette2025(variant: Variant, sourceColorHct: Hct, isDark: boolean): TonalPalette | undefined {
	switch (variant) {
		case Variant.NEUTRAL:
			return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 1.4 * 2.2);
		case Variant.TONAL_SPOT:
			return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 10 * 1.7);
		case Variant.EXPRESSIVE: {
			const neutralHue = DynamicScheme.getRotatedHue(sourceColorHct, [0, 71, 124, 253, 278, 300, 360], [10, 0, 10, 0, 10, 0]);
			const neutralChroma = (isDark ? (Hct.isYellow(neutralHue) ? 6 : 14) : 18);
			return TonalPalette.fromHueAndChroma(neutralHue, neutralChroma * (neutralHue >= 105 && neutralHue < 125 ? 1.6 : 2.3));
		}
		case Variant.VIBRANT: {
			const neutralHue = DynamicScheme.getRotatedHue(sourceColorHct, [0, 38, 105, 140, 333, 360], [-14, 10, -14, 10, -14]);
			return TonalPalette.fromHueAndChroma(neutralHue, 28 * 1.29);
		}
	}
	return undefined;
}