import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const textColorExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "textColor",
			level: "inline",
			start(src: string) { return src.match(/\[#/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[(#[a-fA-F0-9]{3,6}(?:;#[a-fA-F0-9]{3,6})?)\](.+?)\[\/(#[a-fA-F0-9]{3,6}(?:;#[a-fA-F0-9]{3,6})?)?\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "textColor",
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
				const color = (token.color as string).split(";");
				const colorEnd = (token.colorEnd as string | undefined)?.split(";");

				const text = h("span", {
					class: "text-color",
					style: `
						--markdown-text-color-start: ${color[0]};
						--markdown-text-color-end: ${colorEnd?.[0] || color[0]};
					`
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);

				if(color[1]){
					return h("span", {
						class: "text-color-bg",
						style: `
						--markdown-bg-color-start: ${color[1]};
						--markdown-bg-color-end: ${colorEnd?.[1] || color[1]};
					`
					}, text);
				}
				
				return text;
			}
		}
	]
};

export default textColorExtension;