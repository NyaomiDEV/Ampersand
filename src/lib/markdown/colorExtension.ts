import { h } from "vue";
import { MarkedExtension } from "../../../vendor/marked-vue/marked";

const colorExtension: MarkedExtension = {
	extensions: [
		{
			name: "color",
			level: "inline",
			start(src: string) { return src.match(/<#/)?.index; },
			tokenizer(src: string) {
				const rule = /^<(#(?:[0-9a-fA-F]{2}){3})>/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: 'color',
						raw: match[0],
						color: match[1]
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h('span', {
					class: "color",
					style: {
						"--color": token.color
					}
				}, token.color);
			}
		}
	]
};

export default colorExtension;