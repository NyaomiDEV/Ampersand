import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { IonRange } from "@ionic/vue";

const rangeExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "range",
			level: "inline",
			start(src: string) { return src.match(/\[r/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[r=(\d*\.?\d+)%\](.*?)\[\/r\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "range",
						raw: match[0],
						value: match[1],
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h(
					IonRange,
					{
						labelPlacement: "stacked",
						min: 0,
						max: 100,
						value: parseFloat(token.value)
					},
					token.text.length
						? h("span", { slot: "label" }, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text)
						: undefined
				);
			}
		}
	]
};

export default rangeExtension;