import { h, VNode } from "vue";
import { MarkedExtension } from "marked";

const linebreakExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "linebreak",
			level: "block",
			start(src: string) { return src.match(/-/)?.index; },
			tokenizer(src: string) {
				const rule = /^-->$/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "linebreak",
						raw: match[0]
					};
					return token;
				}
				return;
			},
			renderer(_token) {
				return h("p", h("br"));
			}
		}
	]
};

export default linebreakExtension;