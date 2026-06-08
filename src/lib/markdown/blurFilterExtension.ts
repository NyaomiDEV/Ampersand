import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isLength } from "./utils";

const blurFilterExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "blurFilter",
			level: "inline",
			start(src: string) { return src.match(/\[blur=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[blur=(.+?)\](.+?)\[\/blur\]/;
				const match = rule.exec(src);
				if (match) {

					const blur = match[1];

					if (!isLength(blur)) return;

					const token = {
						type: "blurFilter",
						raw: match[0],
						blur,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-filter-blur: ${token.blur}`;
				return h("span", {
					class: "filter-blur",
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
	]
};

export default blurFilterExtension;