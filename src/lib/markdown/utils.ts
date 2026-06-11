import { recursion } from "regex-recursion";

export function getAmpersandMarkdownRegex(tag: string, paramsRegex?: RegExp) {
	const _paramsRegex = paramsRegex ? `(?:=(?<params>${paramsRegex.source}))?` : "";
	// dissecting this because it's hell otherwise
	// so, uhm
	// \[tag matches the beginning of our tag verbatim
	// then we append paramPattern that would be /=(.+?)/ for example and it would match optional parameters
	// then we close the bracket, \]
	// then the hell happens, basically the content capturing group (named) starts
	// and immediately we have a non-capturing group that branches in two parts                     <------ we were here -----
	// and on the left we have the part that should ensure we're not inside a recursive tag                                  |
	// so in essence it's (?!\[tag) that would avoid matching the beginning of a nested tag                                  |
	// and (?!\[/tag\]) that would avoid matching the end of a nested tag                                                    |
	// but the . at the end would indeed match any single character so we're still in the game                               |
	// meanwhile on the right of the OR we have just a (?R=20) that means recurse this pattern unto itself 20 times          |
	// and beyond 20 times, we're just dropping the case                                                                     |
	// NOTE: we still need to recursively match even if we are not using the nested captures inside                          |
	// then we're closing the non-capturing group... do you still remember where we were, right? -----------------------------
	// of course we need to match this zero or more times so drop a * there because even if we wrote a ton this would
	// still match A SINGLE CHARACTER god how painful regex can be, all of this work for A SINGLE CHARACTER makes you feel lost
	// and well we can now close the content capturing group (named). FINALLY
	// then we can just add our end tag with a simple and human regex... \[/tag\]
	//
	// now would this have been easier to implement with AI instead of me chugging beers and questioning my sanity?
	// in this day and age? maybe? thing is, i asked AI and it made so many mistakes that it wasn't even worth it,
	// I felt like a teacher having to correct the mistakes of a rookie programmer on their first hike with regexes
	// and this was Copilot mind you - so no, AI is not for me, especially when I can chug alcohol and come up with something
	// by the end of the day, however one thing that I learned about doing it myself after being fed up by that is that
	// I have so much untapped brain potential when I just outright get angry at something
	//
	// now I know this code will probably be stolen by people and AI alike so at least I ask you two things
	// the first one is to keep this entire paper of my thoughts intact, and if anything you can add to it
	// the second is to give me, or ampersand as a whole, some kind of attribution somewhere in the file you end up
	// copy-pasting the function in, if you REALLY cannot afford to keep the entire paper of comments in.
	//
	// Written June 10 2026 by Nao, now please let me die
	// and let's not forget! This thing *WILL* have bugs, for sure.
	const pattern = `\\[${tag}${_paramsRegex}\\](?<content>(?:(?!\\[${tag})(?!\\[/${tag}\\]).|(?R=20))*)\\[/${tag}\\]`;
	const processed = recursion(pattern);
	return new RegExp(`^${processed.pattern}`, "g");
}

export function isColor(color: string){
	const ele = document.createElement("div");
	ele.style.color = color;
	return ele.style.color.replace(/\s+/g, "").length > 0;
}

export function isImage(background: string) {
	const ele = document.createElement("div");
	ele.style.backgroundImage = background;
	return ele.style.backgroundImage.replace(/\s+/g, "").length > 0;
}

export function isPercentage(maybePercentage: string){
	return maybePercentage.match(/^-?\d*\.?\d+%$/) !== null;
}

export function isLength(maybePercentage: string) {
	return maybePercentage.match(/^-?\d*\.?\d+(?:r?(?:cap|ch|em|ex|ic|lh)|(?:v|cq)(?:h|w|max|min|b|i)|(?:px|cm|mm|Q|in|pc|pt))$/) !== null;
}

export function isAngle(maybeAngle: string) {
	return maybeAngle.match(/^-?\d*\.?\d+(?:deg|grad|rad|turn)$/) !== null;
}

export function isLineWidth(maybeWidth: string) {
	return ["hairline", "thin", "medium", "thick"].includes(maybeWidth) || isLength(maybeWidth);
}

export function isBorderStyle(maybeBorderStyle: string) {
	return ["none", "hidden", "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset"].includes(maybeBorderStyle);
}

export function isBorder(maybeBorder: string) {
	const parts = maybeBorder.split(/\s+?(?![^(]*\))/);
	if (!parts.length || parts.length > 3) return false;

	let color = false;
	let style = false;
	let width = false;

	for (const part of parts) {
		if (isColor(part)) {
			if (color) return false;
			color = true;
		}

		else if (isBorderStyle(part)) {
			if (style) return false;
			style = true;
		}

		else if (isLineWidth(part)) {
			if (width) return false;
			width = true;
		}

		else return false;
	}

	return true;
}

export function isTextDecorationLine(maybeDecorationLine: string){
	return ["none", "spelling-error", "grammar-error"].includes(maybeDecorationLine) || maybeDecorationLine.split(" ").every(x => ["underline", "overline", "line-through"].includes(x));
}

export function isTextDecorationStyle(maybeDecorationStyle: string) {
	return ["solid", "double", "dotted", "dashed", "wavy"].includes(maybeDecorationStyle);
}

export function isTextDecorationThickness(maybeDecorationThickness: string) {
	return ["auto", "from-font"].includes(maybeDecorationThickness) || isLength(maybeDecorationThickness) || isPercentage(maybeDecorationThickness);
}

export function isTextDecoration(maybeDecoration: string) {
	const parts = maybeDecoration.split(/\s+?(?![^(]*\))/);

	let color = false;
	let line = false;
	let style = false;
	let thickness = false;

	let lastWasLine = false;

	for (const part of parts) {
		if (isColor(part)) {
			if (color) return false;
			color = true;
			if(lastWasLine){
				line = true;
				lastWasLine = false;
			}
		}

		else if (isTextDecorationLine(part)) {
			if (line) return false;
			lastWasLine = true;
		}

		else if (isTextDecorationStyle(part)) {
			if (style) return false;
			style = true;
			if (lastWasLine) {
				line = true;
				lastWasLine = false;
			}
		}

		else if (isTextDecorationThickness(part)) {
			if (thickness) return false;
			thickness = true;
			if (lastWasLine) {
				line = true;
				lastWasLine = false;
			}
		}

		else return false;
	}

	return true;
}

export function isColorSpace(maybeColorSpace: string) {
	return maybeColorSpace.match(/^(?:xyz(?:-d50|-d65)?|hsl|hwb|(?:ok)?(?:lch|lab)|rec2020|(?:srgb|display-p3)(?:-linear)?|(?:a98|prophoto)-rgb)$/) !== null;
}

export function isOpenTypeFontProperty(maybeProperty: string) {
	return maybeProperty.match(/^[\x20-\x7E]{4}$/) !== null;
}

export function splitList(valueString?: string) {
	if(!valueString) return [];
	return valueString.trim().split(":").map(x => x.trim());
}

export function splitArguments(valueString?: string){
	if(!valueString) return {};
	return Object.fromEntries(valueString.trim().split(" ").map(x => {
		const pos = x.indexOf("=");
		return [x.slice(0, pos).trim(), x.slice(pos + 1).trim()];
	}));
}

export function splitBlockArguments(valueString: string): Record<string, Record<string, string[]>> {
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