import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const fontSizeExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "font-size",
			level: "inline",
			start(src: string) { return src.match(/\[fs=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[fs=(\d*\.?\d+)\](.+?)\[\/fs\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "font-size",
						raw: match[0],
						size: match[1],
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("span", {
					style: `font-size: ${token.size}em`
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default fontSizeExtension;