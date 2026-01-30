import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const textBorderExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "textBorder",
			level: "inline",
			start(src: string) { return src.match(/\[bt=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[bt=(.+?)\](.+?)\[\/bt\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "textBorder",
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
					const cssStyle = `--markdown-text-border: ${token.border};`;

					return h("span", {
						class: "text-border",
						style: cssStyle
					}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default textBorderExtension;