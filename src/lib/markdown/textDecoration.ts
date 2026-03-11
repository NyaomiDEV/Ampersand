import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const textDecorationExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "textDecoration",
			level: "inline",
			start(src: string) { return src.match(/\[td=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[td=(.+?)\](.+?)\[\/td\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "textDecoration",
						raw: match[0],
						border: match[1],
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				if(token.border.length){
					const cssStyle = `--markdown-text-decoration: ${token.border};`;

					return h("span", {
						class: "text-decoration",
						style: cssStyle
					}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default textDecorationExtension;