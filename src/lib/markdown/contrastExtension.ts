import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isPercentage } from "./utils";

const contrastExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "contrast",
			level: "inline",
			start(src: string) { return src.match(/\[contrast=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[contrast=(\d+%)\](.+?)\[\/contrast\]/;
				const match = rule.exec(src);
				if (match) {

					const contrast = match[1];

					if (!isPercentage(contrast)) return;

					const token = {
						type: "contrast",
						raw: match[0],
						contrast,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-filter-contrast: ${token.contrast}`;
				return h("span", {
					class: "filter-contrast",
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
	]
};

export default contrastExtension;