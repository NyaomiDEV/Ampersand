import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const textColorExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "textColorFg",
			level: "inline",
			start(src: string) { return src.match(/\[fg=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[fg=(.+?)\](.+?)\[\/fg\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "textColorFg",
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
					const cssStyle = `--markdown-text-colors: ${colors.join(", ")};`;

					return h("span", {
						class: `text-color-fg${colors.length === 1 ? "-one" : ""}`,
						style: cssStyle
					}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default textColorExtension;