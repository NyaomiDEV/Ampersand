import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isPercentage } from "./utils";

const grayscaleExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "brightness",
			level: "inline",
			start(src: string) { return src.match(/\[brightness=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[brightness=(.+?)\](.+?)\[\/brightness\]/;
				const match = rule.exec(src);
				if (match) {
					const brightness = match[1];
					if (!isPercentage(brightness)) return;

					const token = {
						type: "brightness",
						raw: match[0],
						brightness,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-filter-brightness: ${token.brightness}`;
				return h("span", {
					class: "filter-brightness",
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
	]
};

export default grayscaleExtension;