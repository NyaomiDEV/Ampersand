import { h, VNode } from "vue";
import { MarkedExtension } from "marked";

const spoilerExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "spoiler",
			level: "inline",
			start(src: string) { return src.match(/\|\|/)?.index; },
			tokenizer(src: string) {
				const rule = /^\|\|(.+?)\|\|/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "spoiler",
						raw: match[0],
						text: match[1],
						tokens: this.lexer.inlineTokens(match[1])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("span", {
					tabindex: -1,
					class: "spoiler"
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default spoilerExtension;