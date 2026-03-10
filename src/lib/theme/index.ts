import { argbFromHex, blueFromArgb, DynamicColor, greenFromArgb, Hct, MaterialDynamicColors, redFromArgb, SchemeFidelity, SchemeTonalSpot } from "@material/material-color-utilities";
import { accessibilityConfig } from "../config";
import { M3 } from "tauri-plugin-m3";
import { platform } from "@tauri-apps/plugin-os";

const dynamicColorsWeWant = [
	"primaryPaletteKeyColor",
	"secondaryPaletteKeyColor",
	"tertiaryPaletteKeyColor",
	"neutralPaletteKeyColor",
	"neutralVariantPaletteKeyColor",
	"background",
	"onBackground",
	"surface",
	"surfaceDim",
	"surfaceBright",
	"surfaceContainerLowest",
	"surfaceContainerLow",
	"surfaceContainer",
	"surfaceContainerHigh",
	"surfaceContainerHighest",
	"onSurface",
	"surfaceVariant",
	"onSurfaceVariant",
	"inverseSurface",
	"inverseOnSurface",
	"outline",
	"outlineVariant",
	"shadow",
	"scrim",
	"surfaceTint",
	"primary",
	"onPrimary",
	"primaryContainer",
	"onPrimaryContainer",
	"inversePrimary",
	"secondary",
	"onSecondary",
	"secondaryContainer",
	"onSecondaryContainer",
	"tertiary",
	"onTertiary",
	"tertiaryContainer",
	"onTertiaryContainer",
	"error",
	"onError",
	"errorContainer",
	"onErrorContainer",
	"primaryFixed",
	"primaryFixedDim",
	"onPrimaryFixed",
	"onPrimaryFixedVariant",
	"secondaryFixed",
	"secondaryFixedDim",
	"onSecondaryFixed",
	"onSecondaryFixedVariant",
	"tertiaryFixed",
	"tertiaryFixedDim",
	"onTertiaryFixed",
	"onTertiaryFixedVariant",
];

const customColorsWeWant = [
	"primary",
	"onPrimary",
	"primaryContainer",
	"onPrimaryContainer"
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

export function addMaterialColors(hex: string, target?: HTMLElement){
	const schemeVariant = accessibilityConfig.themeIsVibrant ? SchemeFidelity : SchemeTonalSpot;

	// Generate new theme
	const schemeLight = new schemeVariant(Hct.fromInt(argbFromHex(hex)), false, accessibilityConfig.contrastLevel);
	const schemeDark = new schemeVariant(Hct.fromInt(argbFromHex(hex)), true, accessibilityConfig.contrastLevel);

	const schemeSuccessLight = new schemeVariant(Hct.fromInt(argbFromHex("#00ff00")), false, accessibilityConfig.contrastLevel);
	const schemeSuccessDark = new schemeVariant(Hct.fromInt(argbFromHex("#00ff00")), false, accessibilityConfig.contrastLevel);

	const schemeWarningLight = new schemeVariant(Hct.fromInt(argbFromHex("#ffff00")), false, accessibilityConfig.contrastLevel);
	const schemeWarningDark = new schemeVariant(Hct.fromInt(argbFromHex("#ffff00")), false, accessibilityConfig.contrastLevel);

	const styleSheet: Map<string, string> = new Map();

	for (const key of dynamicColorsWeWant) {
		styleSheet.set(
			`--md3-light-${key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`,
			rgbFromArgb((MaterialDynamicColors[key] as DynamicColor).getArgb(schemeLight))
		);

		styleSheet.set(
			`--md3-dark-${key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`,
			rgbFromArgb((MaterialDynamicColors[key] as DynamicColor).getArgb(schemeDark))
		);
	}

	for (const key of customColorsWeWant) {
		styleSheet.set(
			`--md3-light-${key
				.replace(/([a-z])([A-Z])/g, "$1-$2")
				.toLowerCase()
				.replace("primary", "success")}`,
			rgbFromArgb((MaterialDynamicColors[key] as DynamicColor).getArgb(schemeSuccessLight))
		);

		styleSheet.set(
			`--md3-dark-${key
				.replace(/([a-z])([A-Z])/g, "$1-$2")
				.toLowerCase()
				.replace("primary", "success")}`,
			rgbFromArgb((MaterialDynamicColors[key] as DynamicColor).getArgb(schemeSuccessDark))
		);

		styleSheet.set(
			`--md3-light-${key
				.replace(/([a-z])([A-Z])/g, "$1-$2")
				.toLowerCase()
				.replace("primary", "warning")}`,
			rgbFromArgb((MaterialDynamicColors[key] as DynamicColor).getArgb(schemeWarningLight))
		);

		styleSheet.set(
			`--md3-dark-${key
				.replace(/([a-z])([A-Z])/g, "$1-$2")
				.toLowerCase()
				.replace("primary", "warning")}`,
			rgbFromArgb((MaterialDynamicColors[key] as DynamicColor).getArgb(schemeWarningDark))
		);

		if(accessibilityConfig.themeIsAmoled){
			styleSheet.set("--md3-dark-background", "0, 0, 0");
			styleSheet.set("--md3-dark-surface", "0, 0, 0");
			styleSheet.set("--md3-dark-on-background", "255, 255, 255");
			styleSheet.set("--md3-dark-on-surface", "255, 255, 255");
		}
	}

	const tones: number[] = [];
	for(let i = 0; i <= 100; i++) tones.push(i);
	tones.push(99, 98, 96, 94, 92, 91, 17, 12, 11, 6, 4);

	for (const i of tones.sort()){
		styleSheet.set(
			`--md3-primary-palette-tone-${i}`,
			rgbFromArgb(schemeLight.primaryPalette.tone(i))
		);
		styleSheet.set(
			`--md3-secondary-palette-tone-${i}`,
			rgbFromArgb(schemeLight.secondaryPalette.tone(i))
		);
		styleSheet.set(
			`--md3-tertiary-palette-tone-${i}`,
			rgbFromArgb(schemeLight.tertiaryPalette.tone(i))
		);
		styleSheet.set(
			`--md3-neutral-palette-tone-${i}`,
			rgbFromArgb(schemeLight.neutralPalette.tone(i))
		);
		styleSheet.set(
			`--md3-neutral-variant-palette-tone-${i}`,
			rgbFromArgb(schemeLight.neutralVariantPalette.tone(i))
		);
		styleSheet.set(
			`--md3-error-palette-tone-${i}`,
			rgbFromArgb(schemeLight.errorPalette.tone(i))
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
