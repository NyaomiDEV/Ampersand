import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const rotationExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "rotation",
			level: "inline",
			start(src: string) { return src.match(/\[rot=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[rot=(-?\d*.?\d+(?:deg|grad|rad|turn))\](.+?)\[\/rot\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "rotation",
						raw: match[0],
						rotation: match[1],
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
				cssStyle.transform = `rotate(${token.rotation})`;
			
				return h("span", {
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default rotationExtension;