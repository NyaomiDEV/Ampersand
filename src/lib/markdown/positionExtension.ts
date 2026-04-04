import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const positionExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "position",
			level: "inline",
			start(src: string) { return src.match(/\[pos=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[pos=(\d*\.?\d+:\d*\.?\d+)\](.+?)\[\/pos\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "position",
						raw: match[0],
						position: match[1],
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const pos = (token.position as string).split(":").map(x => parseFloat(x));
				const cssStyle: Record<string, string> = {};
				if(pos.length === 2){
					cssStyle.display = "inline-block";
					cssStyle.transform = `translate(${pos[0]}em, ${pos[1]}em)`;
				}
				
				return h("span", {
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default positionExtension;