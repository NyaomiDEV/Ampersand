import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isPercentage } from "./utils";

const grayscaleExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "grayscale",
			level: "inline",
			start(src: string) { return src.match(/\[grayscale=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[grayscale=(.+?)\](.+?)\[\/grayscale\]/;
				const match = rule.exec(src);
				if (match) {
					const grayscale = match[1];
					if (!isPercentage(grayscale)) return;

					const token = {
						type: "grayscale",
						raw: match[0],
						grayscale,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-filter-grayscale: ${token.grayscale}`;
				return h("span", {
					class: "filter-grayscale",
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
	]
};

export default grayscaleExtension;