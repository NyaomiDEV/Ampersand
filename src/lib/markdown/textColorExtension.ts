import { h } from "vue";
import { MarkedExtension } from "../../../vendor/marked-vue/marked";

const textColorExtension: MarkedExtension = {
	extensions: [
		{
			name: "textColor",
			level: "inline",
			start(src: string) { return src.match(/\[#/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[(#[a-fA-F0-9]{3,6})\](.+?)\[\/?(#[a-fA-F0-9]{3,6})?\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: 'textColor',
						raw: match[0],
						color: match[1],
						colorEnd: match[3],
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h('span', {
					class: "text-color",
					style: `--markdown-text-color-start: ${token.color}; --markdown-text-color-end: ${token.colorEnd || token.color}`
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default textColorExtension;