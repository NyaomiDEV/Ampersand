import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const fontFamilyExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "fontFamily",
			level: "inline",
			start(src: string) { return src.match(/\[ff=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[ff=(.+?)\](.+?)\[\/ff\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "fontFamily",
						raw: match[0],
						fontFamily: match[1],
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				if(token.fontFamily.length){
					const cssStyle: Record<string, string> = {};
					switch((token.fontFamily as string).toLowerCase()){
						case "cursive":
							cssStyle["--markdown-font-family"] = "Dancing Script";
							break;
						case "pixel":
							cssStyle["--markdown-font-family"] = "Bitcount Single";
							break;
						case "digital":
							cssStyle["--markdown-font-family"] = "Orbitron";
							break;
						case "handwritten":
							cssStyle["--markdown-font-family"] = "Shantell Sans";
							break;
						case "serif":
							cssStyle["--markdown-font-family"] = "Cormorant";
							break;
						case "monospace":
							cssStyle["--markdown-font-family"] = "Source Code Pro";
							break;
						case "playful":
							cssStyle["--markdown-font-family"] = "Lobster Two";
							break;
						case "medieval":
							cssStyle["--markdown-font-family"] = "Cormorant Unicase";
							break;
						case "comic":
							cssStyle["--markdown-font-family"] = "Comic Relief";
							break;
						case "lexend":
							cssStyle["--markdown-font-family"] = "Lexend";
							break;
						case "atkinson":
							cssStyle["--markdown-font-family"] = "Atkinson Hyperlegible";
							break;
						case "dyslexic":
							cssStyle["--markdown-font-family"] = "OpenDyslexic";
							break;
						case "inter":
							cssStyle["--markdown-font-family"] = "Inter";
							break;

					}
					return h("span", {
						class: "font-family",
						style: cssStyle
					}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default fontFamilyExtension;