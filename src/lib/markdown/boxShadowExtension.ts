import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { splitList } from "./utils";

const boxShadowExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "boxShadow",
			level: "inline",
			start(src: string) { return src.match(/\[bsh=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[bsh=(.+?)\](.+?)\[\/bsh\]/;
				const match = rule.exec(src);
				if (match) {
					const shadows = splitList(match[1]);

					const isValid = shadows.reduce((p, c) => {
						if(!p) return p;
						if (c.match(/(?!\(.*?),(?!.*?\))/) !== null) return false;

						const a = document.createElement("div");
						a.style.boxShadow = c;
						return a.style.boxShadow.replace(/\s+/g, "").length > 0;
					}, true);
					if(!isValid) return;

					const token = {
						type: "boxShadow",
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
					const shadows = token.shadows as string[];
					const cssStyle = `--markdown-box-shadow: ${shadows.join(", ")};`;

					return h("span", {
						class: "box-shadow",
						style: cssStyle
					}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default boxShadowExtension;