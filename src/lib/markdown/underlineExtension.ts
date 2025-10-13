import { h, VNode } from "vue";
import { MarkedExtension } from "marked";

const underlineExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "underline",
			level: "inline",
			start(src: string) { return src.match(/\+/)?.index; },
			tokenizer(src: string) {
				const rule = /^\+\+(.+?)\+\+/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "underline",
						raw: match[0],
						text: match[1],
						tokens: this.lexer.inlineTokens(match[1])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("u", token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default underlineExtension;