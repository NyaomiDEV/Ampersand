import { h } from "vue";
import { MarkedExtension } from "../../../vendor/marked-vue/marked";

const linebreakExtension: MarkedExtension = {
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