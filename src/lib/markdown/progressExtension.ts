import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { IonProgressBar } from "@ionic/vue";
import { isColor, splitList } from "./utils";

const progressExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "progress",
			level: "block",
			start(src: string) { return src.match(/^\[pr/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[pr=(-?\d*\.?\d+)(?::(.+?))?\]/;
				const match = rule.exec(src);
				if (match) {
					const value = parseFloat(match[1]);
					if (isNaN(value)) return;

					const colors = splitList(match[2] || "");
					if(colors.length > 2 || !colors.every(x => isColor(x))) return;

					const token = {
						type: "progress",
						raw: match[0],
						value,
						color: colors[0],
						backgroundColor: colors[1],
						tokens: []
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h(
					IonProgressBar,
					{
						value: token.value / 100,
						type: token.value < 0 ? "indeterminate" : "determinate",
						style: {
							"--background": token.backgroundColor,
							"--progress-background": token.color
						}
					}
				);
			}
		}
	]
};

export default progressExtension;