import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const smallTextExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "smallText",
			level: "block",
			start(src: string) { return src.match(/-# /)?.index; },
			tokenizer(src: string) {
				const rule = /^-# (.+?)(?:\n|$)/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "smallText",
						raw: match[0],
						text: match[1],
						tokens: this.lexer.inlineTokens(match[1])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("p", {
					class: "small-text"
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default smallTextExtension;