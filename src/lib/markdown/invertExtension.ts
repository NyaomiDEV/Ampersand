import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isPercentage } from "./utils";

const invertExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "invert",
			level: "inline",
			start(src: string) { return src.match(/\[invert=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[invert=(.+?)\](.+?)\[\/invert\]/;
				const match = rule.exec(src);
				if (match) {
					const invert = match[1];
					if (!isPercentage(invert)) return;

					const token = {
						type: "invert",
						raw: match[0],
						invert,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-filter-invert: ${token.invert}`;
				return h("span", {
					class: "filter-invert",
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
	]
};

export default invertExtension;