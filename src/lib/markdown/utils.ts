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