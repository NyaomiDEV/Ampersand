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
	return maybePercentage.match(/^-?\d+%$/) !== null;
}

export function isCssLength(maybePercentage: string) {
	return maybePercentage.match(/^-?\d+(?:r?(?:cap|ch|em|ex|ic|lh)|(?:v|cq)(?:h|w|max|min|b|i)|(?:px|cm|mm|Q|in|pc|pt))$/) !== null;
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