import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const figureExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "figure",
			level: "block",
			start(src: string) { return src.match(/\[figure\]/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[figure\]([\s\S]+?)\[\/figure\]/;
				const match = rule.exec(src);
				if (match) {
					const childTokens = this.lexer.inlineTokens(match[1])
						.filter(x => x.type !== "br")
						.map(x => {
							if(x.type === "text")
								x.type = "figure-caption";

							return x;
						});

					const token = {
						type: "figure",
						raw: match[0],
						text: match[1],
						tokens: childTokens
					};

					return token;
				}
				return;
			},
			renderer(token) {
				return h("figure", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
		{
			name: "figure-caption",
			level: "inline",
			renderer(token) {
				return h("figcaption", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default figureExtension;