import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const textShadowExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "textShadow",
			level: "inline",
			start(src: string) { return src.match(/\[sh=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[sh=(.+?)\](.+?)\[\/sh\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "textShadow",
						raw: match[0],
						shadow: match[1],
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				if(token.shadow.length){
					const cssStyle = `--markdown-text-shadow: ${token.shadow};`;

					return h("span", {
						class: "text-shadow",
						style: cssStyle
					}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default textShadowExtension;