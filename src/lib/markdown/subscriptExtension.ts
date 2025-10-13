import { h, VNode } from "vue";
import { MarkedExtension } from "marked";

const subscriptExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "subscript",
			level: "inline",
			start(src: string) { return src.match(/~/)?.index; },
			tokenizer(src: string) {
				const rule = /^(~)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "subscript",
						raw: match[0],
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("sub", token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default subscriptExtension;