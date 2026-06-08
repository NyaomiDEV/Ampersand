import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const centerExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "center",
			level: "block",
			start(src: string) { return src.match(/\|\|>/)?.index; },
			tokenizer(src: string) {
				const rule = /^\|\|>([\s\S]+?)<\|\|/s;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "center",
						raw: match[0],
						text: match[1],
						tokens: this.lexer.blockTokens(match[1])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("p", { class: "center" }, token.tokens && token.tokens.length ? this.parser.parse(token.tokens) : token.text);
			}
		}
	]
};

export default centerExtension;