import { h } from "vue";
import { MarkedExtension } from "../../../vendor/marked-vue/marked";

const highlightExtension: MarkedExtension = {
	extensions: [
		{
			name: "highlight",
			level: "inline",
			start(src: string) { return src.match(/==/)?.index; },
			tokenizer(src: string) {
				const rule = /^==(.+?)==/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "highlight",
						raw: match[0],
						text: match[1],
						tokens: this.lexer.inlineTokens(match[1])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("mark", token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default highlightExtension;