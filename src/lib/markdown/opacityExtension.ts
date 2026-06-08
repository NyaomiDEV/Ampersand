import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isPercentage } from "./utils";

const opacityExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "opacity",
			level: "inline",
			start(src: string) { return src.match(/\[opacity=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[opacity=(\d+%)\](.+?)\[\/opacity\]/;
				const match = rule.exec(src);
				if (match) {

					const opacity = match[1];

					if (!isPercentage(opacity)) return;

					const token = {
						type: "opacity",
						raw: match[0],
						opacity,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-filter-opacity: ${token.opacity}`;
				return h("span", {
					class: "filter-opacity",
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
	]
};

export default opacityExtension;