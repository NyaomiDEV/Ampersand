import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { splitList, isLength, isColor } from "./utils";

const textOutlineExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "text-outline",
			level: "inline",
			start(src: string) { return src.match(/\[to=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[to=(.+?)\](.+?)\[\/to\]/;
				const match = rule.exec(src);
				if (match) {

					const outline = splitList(match[1]);
					if (outline.length !== 2) return;
					const [width, color] = outline;
					if (!isLength(width) || !isColor(color)) return;

					const token = {
						type: "text-outline",
						raw: match[0],
						width,
						color,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("span", {
					class: "text-outline",
					style: {
						"--markdown-text-outline-width": token.width,
						"--markdown-text-outline-color": token.color
					}
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default textOutlineExtension;