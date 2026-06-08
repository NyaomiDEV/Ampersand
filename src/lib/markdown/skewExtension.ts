import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isAngle, splitList } from "./utils";

const skewExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "skew",
			level: "inline",
			start(src: string) { return src.match(/\[hue=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[skew=(.+?)\](.+?)\[\/skew\]/;
				const match = rule.exec(src);
				if (match) {
					const degrees = splitList(match[1]);
					if (degrees.length > 2 || !degrees.every(x => isAngle(x))) return;

					const token = {
						type: "skew",
						raw: match[0],
						degrees,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("span", {
					class: "skew",
					style: {
						"--markdown-skew-x": token.degrees[0],
						"--markdown-skew-y": token.degrees[1] || 0
					}
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
	]
};

export default skewExtension;