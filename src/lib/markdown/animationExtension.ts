import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const animationExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "animation",
			level: "inline",
			start(src: string) { return src.match(/\[ani=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[ani=(.+?)\](.+?)\[\/ani\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "animation",
						aniType: match[1],
						raw: match[0],
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const [ type, duration ] = (token.aniType as string).split(":");
				return h("span", {
					class: "animation",
					"data-animation-type": type,
					style: duration ? `--markdown-animation-duration: ${duration}s` : undefined
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default animationExtension;