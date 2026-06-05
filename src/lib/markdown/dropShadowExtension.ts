import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { splitList } from "./utils";

const dropShadowExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "dropShadow",
			level: "inline",
			start(src: string) { return src.match(/\[sh=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[sh=(.+?)\](.+?)\[\/sh\]/;
				const match = rule.exec(src);
				if (match) {
					const shadows = splitList(match[1] || "");

					if (!shadows.every(x => {
						const a = document.createElement("div");
						a.style.filter = `drop-shadow(${x})`;
						return a.style.filter.replace(/\s+/g, "").length > 0;
					})) return;

					const token = {
						type: "dropShadow",
						raw: match[0],
						shadows,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				if(token.shadows.length){
					const cssStyle = `--markdown-drop-shadow: ${(token.shadows as string[]).map(x => `drop-shadow(${x})`).join(" ")};`;

					return h("span", {
						class: "drop-shadow",
						style: cssStyle
					}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default dropShadowExtension;