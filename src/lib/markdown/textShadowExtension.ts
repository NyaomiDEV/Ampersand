import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { splitList } from "./utils";

const textShadowExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "textShadow",
			level: "inline",
			start(src: string) { return src.match(/\[sh=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[sh=(.+?)\](.+?)\[\/sh\]/;
				const match = rule.exec(src);
				if (match) {
					const shadows = splitList(match[1] || "");

					const isValid = shadows.reduce((p, c) => {
						if (!p) return p;
						if (c.match(/(?!\(.*?),(?!.*?\))/) !== null) return false;

						const a = document.createElement("div");
						a.style.textShadow = c;
						return a.style.textShadow.replace(/\s+/g, "").length > 0;
					}, true);
					if (!isValid) return;

					const token = {
						type: "textShadow",
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
					const cssStyle = `--markdown-text-shadow: ${(token.shadows as string[]).join(", ")};`;

					return h("span", {
						class: "text-shadow",
						style: cssStyle
					}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default textShadowExtension;