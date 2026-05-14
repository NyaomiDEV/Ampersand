import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { splitList } from "./utils";

const textBorderExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "textBorder",
			level: "inline",
			start(src: string) { return src.match(/\[bt=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[bt=(.+?)\](.+?)\[\/bt\]/;
				const match = rule.exec(src);
				if (match) {
					const borders = splitList(match[1] || "");

					const isValid = borders.reduce((p, c) => {
						if (!p) return p;

						const a = document.createElement("div");
						a.style.borderTop = c;
						return a.style.borderTop.replace(/\s+/g, "").length > 0;
					}, true);


					if(!isValid) return;

					const token = {
						type: "textBorder",
						raw: match[0],
						borders,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				if(token.borders.length){
					const borders = token.borders as string[];
					const cssStyle: Record<string, string> = {};
					switch(borders.length){
						case 1:
						default:
							cssStyle["--markdown-text-border-left"] = borders[0];
							cssStyle["--markdown-text-border-top"] = borders[0];
							cssStyle["--markdown-text-border-right"] = borders[0];
							cssStyle["--markdown-text-border-bottom"] = borders[0];
							break;
						case 2:
							cssStyle["--markdown-text-border-left"] = borders[1];
							cssStyle["--markdown-text-border-top"] = borders[0];
							cssStyle["--markdown-text-border-right"] = borders[1];
							cssStyle["--markdown-text-border-bottom"] = borders[0];
							break;
						case 3:
							cssStyle["--markdown-text-border-left"] = borders[1];
							cssStyle["--markdown-text-border-top"] = borders[0];
							cssStyle["--markdown-text-border-right"] = borders[1];
							cssStyle["--markdown-text-border-bottom"] = borders[2];
							break;
						case 4:
							cssStyle["--markdown-text-border-left"] = borders[3];
							cssStyle["--markdown-text-border-top"] = borders[0];
							cssStyle["--markdown-text-border-right"] = borders[1];
							cssStyle["--markdown-text-border-bottom"] = borders[2];
							break;
					}
					
					return h("span", {
						class: "text-border",
						style: cssStyle
					}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default textBorderExtension;