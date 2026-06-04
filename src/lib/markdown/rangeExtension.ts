import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { IonRange } from "@ionic/vue";
import { splitList } from "./utils";

const rangeExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "range",
			level: "inline",
			start(src: string) { return src.match(/\[ra/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[ra=(\d*\.?\d+(?::\d*\.?\d+)?)\](.*?)\[\/ra\]/;
				const match = rule.exec(src);
				if (match) {
					const values = splitList(match[1]).map(x => parseFloat(x));
					if (values.length > 2 || values.find(x => isNaN(x))) return;

					const token = {
						type: "range",
						raw: match[0],
						values,
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
						ticks: true,
						snaps: true,
						step: 10,
						dualKnobs: token.values.length > 1,
						value: token.values.length > 1 ? { lower: Math.min(...token.values), upper: Math.max(...token.values) } : token.values[0]
					},
					() => token.text.length
						? h("span", { slot: "label" }, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text)
						: undefined
				);
			}
		}
	]
};

export default rangeExtension;