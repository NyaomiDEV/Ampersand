import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

import emojis from "../../assets/emojis.json";
const emojiData = import.meta.webpackContext("../../assets/emojis/", { recursive: true, exclude: /LICENSE*/ });

const emojiExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "emoji",
			level: "inline",
			start(src) { return src.match(/:/)?.index; },
			tokenizer(src: string) {
				const rule = /^:(.+?):/;
				const match = rule.exec(src);
				if (match) {
					const name = match[1];
					const emoji = emojis.find(x => x.names.includes(name));
					if(!emoji) return;

					const token = {
						type: "emoji",
						raw: match[0],
						name,
						emoji
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("img", {
					class: "markdown-emoji",
					alt: token.name,
					src: emojiData(`./${token.emoji.value}`)
				});
			}
		}
	]
};

export default emojiExtension;