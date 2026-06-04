import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isColorSpace, isCssLength, isPercentage, isValidCssColor, splitList } from "./utils";

const textColorExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "textColorFg",
			level: "inline",
			start(src: string) { return src.match(/\[fg=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[fg=(.+?)\](.+?)\[\/fg\]/;
				const match = rule.exec(src);
				if (match) {
					let isRepeating = false;
					let isRadial = false;
					let colorspace = "srgb";

					let linearDegrees = "90deg";
					let radialDefinition = "circle at 50% 50%";

					const colors = splitList(match[1] || "");

					if (colors[0] === "radial") {
						colors.shift();
						isRadial = true;
					}

					if(colors[0] === "repeating"){
						colors.shift();
						isRepeating = true;
					}

					if(isColorSpace(colors[0]))
						colorspace = colors.shift()!;

					if (isRadial) {
						const _match =
							/ellipse ?((?:(?:-?\d*\.?\d+[^\s]+) ?){1,2})?(?:at )?((?:(?:-?\d*\.?\d+[^\s]+) ?){1,2})?/.exec(colors[0]) ||
							/circle ?(-?\d*\.?\d+[^\s]+)?(?: at )?((?:(?:-?\d*\.?\d+[^\s]+) ?){1,2})?/.exec(colors[0]);

						if (
							_match !== null &&
							(_match[1] ? _match[1].trim().split(" ").every(x => isCssLength(x.trim()) || isPercentage(x.trim())) : true) &&
							(_match[2] ? _match[2].trim().split(" ").every(x => isCssLength(x.trim()) || isPercentage(x.trim())) : true)
						)
							radialDefinition = colors.shift()!;
					} else {
						if (colors[0].match(/(?: ?(?:top|left|right|bottom)){1,2}|(?:-?\d*.?\d+(?:deg|grad|rad|turn))/) !== null)
							linearDegrees = colors.shift()!;
					}

					if (!colors.every(
						x => {
							const parts = x.split(/\s+?(?![^(]*\))/);
							if (!parts.length || parts.length > 3) return false;
							const color = parts.shift()!;

							return isValidCssColor(color) && parts.every(x => isCssLength(x) || isPercentage(x));
						}
					))
						return; // one wasn't a real color
						
					const token = {
						type: "textColorFg",
						raw: match[0],
						isRadial,
						isRepeating,
						colorspace,
						linearDegrees,
						radialDefinition,
						colors,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const colors = (token.colors as string[]);

				const directionsY = ["top", "bottom"];
				const directionsX = ["left", "right"];

				const directions = [
					...directionsX,
					...directionsY,
					...directionsY.map(y => directionsX.map(x => `${x} ${y}`)).flat(1),
					...directionsX.map(x => directionsY.map(y => `${y} ${x}`)).flat(1)
				];

				if(colors.length){
					const cssStyle: Record<string, string> = {
						"--markdown-text-fg-colorspace": token.colorspace,
						"--markdown-text-fg-colors": colors.join(", "),
						"--markdown-text-fg-degrees": directions.includes(token.linearDegrees) ? `to ${token.linearDegrees}` : token.linearDegrees,
						"--markdown-text-fg-radial-definition": token.radialDefinition
					};

					return h("span", {
						class: [`text-color-fg${colors.length === 1 ? "-one" : ""}`, token.isRepeating ? "repeating" : undefined, token.isRadial ? "radial" : undefined],
						style: cssStyle
					}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default textColorExtension;