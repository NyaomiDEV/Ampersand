import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isPercentage } from "./utils";

const saturateExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "saturate",
			level: "inline",
			start(src: string) { return src.match(/\[saturate=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[saturate=(.+?)\](.+?)\[\/saturate\]/;
				const match = rule.exec(src);
				if (match) {
					const saturate = match[1];
					if (!isPercentage(saturate)) return;

					const token = {
						type: "saturate",
						raw: match[0],
						saturate,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-filter-saturate: ${token.saturate}`;
				return h("span", {
					class: "filter-saturate",
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
	]
};

export default saturateExtension;