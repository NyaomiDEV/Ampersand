import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const blurExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "blur",
			level: "inline",
			start(src: string) { return src.match(/#/)?.index; },
			tokenizer(src: string) {
				const rule = /^#(.+?)#/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "blur",
						raw: match[0],
						text: match[1],
						tokens: this.lexer.inlineTokens(match[1])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("span", { class: "blur", tabindex: -1, }, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default blurExtension;