import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isAngle } from "./utils";

const rotationExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "rotationInline",
			level: "inline",
			start(src: string) { return src.match(/\[rot=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[rot=(-?\d*.?\d+(?:deg|grad|rad|turn))\](.+?)\[\/rot\]/;
				const match = rule.exec(src);
				if (match) {

					const rotation = match[1];
					if (!isAngle(rotation)) return;

					const token = {
						type: "rotationInline",
						raw: match[0],
						rotation,
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
		},
		{
			name: "rotation",
			level: "block",
			start(src: string) { return src.match(/^\[rot=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[rot=(-?\d*.?\d+(?:deg|grad|rad|turn))\]([\s\S]+?)\[\/rot\]/;
				const match = rule.exec(src);
				if (match) {

					const rotation = match[1];
					if (!isAngle(rotation)) return;

					const token = {
						type: "rotation",
						raw: match[0],
						rotation,
						text: match[2],
						tokens: this.lexer.blockTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle: Record<string, string> = {};

				cssStyle.display = "block";
				cssStyle.transform = `rotate(${token.rotation})`;

				return h("div", {
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parse(token.tokens) : token.text);
			}
		}
	]
};

export default rotationExtension;