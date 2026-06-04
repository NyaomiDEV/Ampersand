import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { splitList } from "./utils";

const positionExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "position",
			level: "inline",
			start(src: string) { return src.match(/\[pos=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[pos=(-?\d*\.?\d+:-?\d*\.?\d+)\](.+?)\[\/pos\]/;
				const match = rule.exec(src);
				if (match) {
					const position = splitList(match[1]).map(x => parseFloat(x));
					if (position.length !== 2 || position.find(x => isNaN(x))) return;

					const token = {
						type: "position",
						raw: match[0],
						position,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle: Record<string, string> = {};
				cssStyle.display = "inline-block";
				cssStyle.transform = `translate(${token.position[0]}em, ${token.position[1]}em)`;
				
				return h("span", {
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default positionExtension;