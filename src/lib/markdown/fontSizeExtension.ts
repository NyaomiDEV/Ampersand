import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { getAmpersandMarkdownRegex, splitList } from "./utils";

const fontSizeExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "fontSizeInline",
			level: "inline",
			start(src: string) { return src.match(/\[fs=/)?.index; },
			tokenizer(src: string) {
				const rule = getAmpersandMarkdownRegex("fs", /\d*\.?\d+(?::\d*\.?\d+)?/);
				const match = rule.exec(src);
				if (match) {
					const sizes = splitList(match[1]).map(x => parseFloat(x));
					if(sizes.find(x => isNaN(x))) return;

					const token = {
						type: "fontSizeInline",
						raw: match[0],
						sizes,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const sizes = (token.sizes as number[]);
				const cssStyle: Record<string, string> = {};
				if(sizes.length > 1){
					cssStyle.display = "inline-block";
					cssStyle["font-size"] = `${sizes[0]}em`;
					cssStyle.transform = `scaleY(${sizes[1] / sizes[0]})`;
				} else 
					cssStyle["font-size"] = `${sizes[0]}em`;
				
				return h("span", {
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default fontSizeExtension;