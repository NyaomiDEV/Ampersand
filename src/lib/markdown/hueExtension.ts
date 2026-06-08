import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isAngle } from "./utils";

const hueExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "hue",
			level: "inline",
			start(src: string) { return src.match(/\[hue=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[hue=(-?\d*.?\d+(?:deg|grad|rad|turn))\](.+?)\[\/hue\]/;
				const match = rule.exec(src);
				if (match) {

					const hue = match[1];

					if (!isAngle(hue)) return;

					const token = {
						type: "hue",
						raw: match[0],
						hue,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-filter-hue: ${token.hue}`;
				return h("span", {
					class: "filter-hue",
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
	]
};

export default hueExtension;