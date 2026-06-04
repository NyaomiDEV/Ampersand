import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isColor } from "./utils";

const colorExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "color",
			level: "inline",
			start(src: string) { return src.match(/<#/)?.index; },
			tokenizer(src: string) {
				const rule = /^<#(.+?)>/;
				const match = rule.exec(src);
				if (match) {
					const isHex = /(?:[0-9a-fA-F]{2}){3}/.exec(match[1]) !== null;
					if(isHex) match[1] = `#${match[1]}`;

					if(isColor(match[1])){
						const token = {
							type: "color",
							raw: match[0],
							color: match[1]
						};
						return token;
					}
				}
				return;
			},
			renderer(token) {
				return h("span", {
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