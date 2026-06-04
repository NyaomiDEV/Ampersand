export function isValidCssColor(color: string){
	const ele = document.createElement("div");
	ele.style.color = color;
	return ele.style.color.replace(/\s+/g, "").length > 0;
}

export function isValidCssBackground(background: string) {
	const ele = document.createElement("div");
	ele.style.backgroundImage = background;
	return ele.style.backgroundImage.replace(/\s+/g, "").length > 0;
}

export function isPercentage(maybePercentage: string){
	return maybePercentage.match(/^-?\d*\.?\d+%$/) !== null;
}

export function isCssLength(maybePercentage: string) {
	return maybePercentage.match(/^-?\d*\.?\d+(?:r?(?:cap|ch|em|ex|ic|lh)|(?:v|cq)(?:h|w|max|min|b|i)|(?:px|cm|mm|Q|in|pc|pt))$/) !== null;
}

export function isValidBorderWidth(maybeWidth: string) {
	return ["hairline", "thin", "medium", "thick"].includes(maybeWidth) || isCssLength(maybeWidth);
}

export function isValidBorderStyle(maybeBorderStyle: string) {
	return ["none", "hidden", "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset"].includes(maybeBorderStyle);
}

export function isValidBorder(maybeBorder: string) {
	const parts = maybeBorder.split(/\s+?(?![^(]*\))/);
	if (!parts.length || parts.length > 3) return false;

	let color = false;
	let style = false;
	let width = false;

	for (const part of parts) {
		if (isValidCssColor(part)) {
			if (color) return false;
			color = true;
		}

		else if (isValidBorderStyle(part)) {
			if (style) return false;
			style = true;
		}

		else if (isValidBorderWidth(part)) {
			if (width) return false;
			width = true;
		}
	}

	return true;
}

export function isColorSpace(maybeColorSpace: string) {
	return maybeColorSpace.match(/^(?:xyz(?:-d50|-d65)?|hsl|hwb|(?:ok)?(?:lch|lab)|rec2020|(?:srgb|display-p3)(?:-linear)?|(?:a98|prophoto)-rgb)$/) !== null;
}

export function splitList(valueString: string) {
	return valueString.trim().split(":").map(x => x.trim());
}

export function splitArguments(valueString: string){
	return Object.fromEntries(valueString.trim().split(" ").map(x => {
		const pos = x.indexOf("=");
		return [x.slice(0, pos).trim(), x.slice(pos + 1).trim()];
	}));
}

export function splitBlockArguments(valueString: string) {
	return Object.fromEntries(valueString
		.trim()
		.split("\n")
		.map(x => {
			const i = x.indexOf(" ");
			return [
				x.slice(0, i).trim(),
				Object.fromEntries(
					x.slice(i+1).trim().split(";").map(y => {
						const j = y.indexOf("=");
						return [y.slice(0, j).trim(), y.slice(j+1).trim().split(":").map(z => z.trim())];
					})
				)
			];
		}));
}