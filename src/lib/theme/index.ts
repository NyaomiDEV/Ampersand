import { argbFromHex, blueFromArgb, greenFromArgb, redFromArgb, themeFromSourceColor } from "@material/material-color-utilities";

function rgbFromArgb(argb: number){
	return [
		redFromArgb(argb),
		greenFromArgb(argb),
		blueFromArgb(argb)
	].join(", ");
}

export function defineMaterialTheme(hex: string){
	// Clean up
	Array.from(document.documentElement.style)
		.filter(x => x.startsWith("--md3"))
		.forEach(x => document.documentElement.style.removeProperty(x));

	// Generate new theme
	const theme = themeFromSourceColor(argbFromHex(hex));

	for (const [key, value] of Object.entries(theme.schemes.dark.toJSON())) {
		const token = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
		const color = rgbFromArgb(value);
		document.documentElement.style.setProperty(`--md3-dark-${token}`, color);
	}

	for (const [key, value] of Object.entries(theme.schemes.light.toJSON())) {
		const token = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
		const color = rgbFromArgb(value);
		document.documentElement.style.setProperty(`--md3-light-${token}`, color);
	}

	const extraTones = [99, 98, 11, 12];

	for (let i = 0; i <= 100; i += 5) {
		const color = rgbFromArgb(theme.palettes.neutral.tone(i));
		document.documentElement.style.setProperty(`--md3-shade-${i}`, color);
	}

	for (const i of extraTones){
		const color = rgbFromArgb(theme.palettes.neutral.tone(i));
		document.documentElement.style.setProperty(`--md3-shade-${i}`, color);
	}

	// add md3 to root class
	document.documentElement.classList.add("md3");
}
