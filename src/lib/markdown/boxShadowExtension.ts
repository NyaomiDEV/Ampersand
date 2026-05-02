import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const boxShadowExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "boxShadow",
			level: "inline",
			start(src: string) { return src.match(/\[bsh=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[bsh=(.+?)\](.+?)\[\/bsh\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "boxShadow",
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
					const cssStyle = `--markdown-box-shadow: ${token.shadow};`;

					return h("span", {
						class: "box-shadow",
						style: cssStyle
					}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default boxShadowExtension;