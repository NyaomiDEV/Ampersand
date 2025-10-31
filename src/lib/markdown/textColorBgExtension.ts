import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const textColorBgExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "textColorBg",
			level: "inline",
			start(src: string) { return src.match(/\[bg=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[bg=(.+?)\](.+?)\[\/bg\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "textColorBg",
						raw: match[0],
						colors: match[1].split(":"),
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const colors = (token.colors as string[]);

				if(colors.length){
					const cssStyle = `--markdown-text-bg-colors: ${colors.join(", ")};`;

					return h("span", {
						class: "text-color-bg",
						style: cssStyle
					}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default textColorBgExtension;