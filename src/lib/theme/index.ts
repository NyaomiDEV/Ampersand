import { argbFromHex, blueFromArgb, DynamicColor, greenFromArgb, Hct, MaterialDynamicColors, redFromArgb, SchemeTonalSpot, themeFromSourceColor } from "@material/material-color-utilities";
import { accessibilityConfig } from "../config";
import { M3 } from "tauri-plugin-m3";

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

const defaultColor = "#7E5700";

const material3 = new M3();
const m3colors = await material3.fetch().colors();
console.log(m3colors);

function rgbFromArgb(argb: number){
	return [
		redFromArgb(argb),
		greenFromArgb(argb),
		blueFromArgb(argb)
	].join(", ");
}

export function updateMaterialColors(target?: HTMLElement){
	const useAccentColor = accessibilityConfig.useAccentColor;
	const accentColor = accessibilityConfig.accentColor;
	if (useAccentColor && accentColor)
		addMaterialColors(accentColor, target);
	else if(m3colors)
		addMaterialColors(m3colors.primary || defaultColor, target);
	else
		addMaterialColors(defaultColor, target);
}

export function activateMaterialTheme(target?: HTMLElement) {
	(target ?? document.documentElement).classList.add("md3");
}

export function deactivateMaterialTheme(target?: HTMLElement) {
	(target ?? document.documentElement).classList.remove("md3");
}

export function unsetMaterialColors(target?: HTMLElement){
	// Clean up
	if(target)
		return Array.from(target.style)
			.filter(x => x.startsWith("--md3"))
			.forEach(x => target.style.removeProperty(x));

	return Array.from(document.documentElement.style)
		.filter(x => x.startsWith("--md3"))
		.forEach(x => document.documentElement.style.removeProperty(x));
}

export function addMaterialColors(hex: string, target?: HTMLElement){
	// Generate new theme
	const tonalSpotLight = new SchemeTonalSpot(Hct.fromInt(argbFromHex(hex)), false, 0);
	const tonalSpotDark = new SchemeTonalSpot(Hct.fromInt(argbFromHex(hex)), true, 0);

	const styleSheet: Map<string, string> = new Map();

	for (const key of dynamicColorsWeWant) {
		styleSheet.set(
			`--md3-light-${key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`,
			rgbFromArgb((MaterialDynamicColors[key] as DynamicColor).getArgb(tonalSpotLight))
		);

		styleSheet.set(
			`--md3-dark-${key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`,
			rgbFromArgb((MaterialDynamicColors[key] as DynamicColor).getArgb(tonalSpotDark))
		);
	}

	const tones: number[] = [];
	for(let i = 0; i <= 100; i++) tones.push(i);
	tones.push(99, 98, 96, 94, 92, 91, 17, 12, 11, 6, 4);

	for (const i of tones.sort()){
		styleSheet.set(
			`--md3-primary-palette-tone-${i}`,
			rgbFromArgb(tonalSpotLight.primaryPalette.tone(i))
		);
		styleSheet.set(
			`--md3-secondary-palette-tone-${i}`,
			rgbFromArgb(tonalSpotLight.secondaryPalette.tone(i))
		);
		styleSheet.set(
			`--md3-tertiary-palette-tone-${i}`,
			rgbFromArgb(tonalSpotLight.tertiaryPalette.tone(i))
		);
		styleSheet.set(
			`--md3-neutral-palette-tone-${i}`,
			rgbFromArgb(tonalSpotLight.neutralPalette.tone(i))
		);
		styleSheet.set(
			`--md3-neutral-variant-palette-tone-${i}`,
			rgbFromArgb(tonalSpotLight.neutralVariantPalette.tone(i))
		);
		styleSheet.set(
			`--md3-error-palette-tone-${i}`,
			rgbFromArgb(tonalSpotLight.errorPalette.tone(i))
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
