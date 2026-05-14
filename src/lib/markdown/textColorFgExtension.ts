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
					let colorspace = "srgb";
					let degrees = "90deg";
					const colors = splitList(match[1] || "");

					if(isColorSpace(colors[0]))
						colorspace = colors.shift()!;

					if (colors[0].match(/(?: ?(?:top|left|right|bottom)){1,2}|(?:-?\d*.?\d+(?:deg|grad|rad|turn))/) !== null) 
						degrees = colors.shift()!;

					if(!colors.reduce(
						(p, c) => {
							if(!p) return p;
							const parts = c.split(" ");
							if (!parts.length || parts.length > 3) return false;
							const color = parts.shift()!;
							if(!isValidCssColor(color)) return false;
							const percentagesIsValid = parts.reduce((p, c) => p ? (isCssLength(c) || isPercentage(c)) : p, true);
							if(!percentagesIsValid) return false;
							return true;
						},
						true
					))
						return; // one wasn't a real color
						
					const token = {
						type: "textColorFg",
						raw: match[0],
						colorspace,
						degrees,
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
						"--markdown-text-fg-degrees": directions.includes(token.degrees) ? `to ${token.degrees}` : token.degrees
					};

					return h("span", {
						class: `text-color-fg${colors.length === 1 ? "-one" : ""}`,
						style: cssStyle
					}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default textColorExtension;