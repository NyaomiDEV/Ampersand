import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isPercentage } from "./utils";

const sepiaExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "sepia",
			level: "inline",
			start(src: string) { return src.match(/\[sepia=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[sepia=(.+?)\](.+?)\[\/sepia\]/;
				const match = rule.exec(src);
				if (match) {
					const sepia = match[1];
					if (!isPercentage(sepia)) return;

					const token = {
						type: "sepia",
						raw: match[0],
						sepia,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-filter-sepia: ${token.sepia}`;
				return h("span", {
					class: "filter-sepia",
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
	]
};

export default sepiaExtension;