import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const disallowedFontParameters = ["wght", "wdth", "slnt", "ital", "opsz"];

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
					const [family, ..._para] = match[1].split(":");

					const parameters = _para.map(x => {
						const parts = x.split(" ");
						if(disallowedFontParameters.includes(parts[0].toString()))
							return undefined;

						return [parts[0].toUpperCase(), parseFloat(parts[1])];
					}).filter(x => !!x);

					const token = {
						type: "fontFamily",
						raw: match[0],
						fontFamily: family,
						fontVarSettings: parameters,
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
							cssStyle["--markdown-font-family"] = "Rochester";
							break;
						case "pixel":
							cssStyle["--markdown-font-family"] = "Departure Mono";
							break;
						case "dots":
							cssStyle["--markdown-font-family"] = "Bitcount Single";
							break;
						case "digital":
							cssStyle["--markdown-font-family"] = "Orbitron";
							break;
						case "handwritten":
							cssStyle["--markdown-font-family"] = "Shantell Sans";
							break;
						case "serif":
							cssStyle["--markdown-font-family"] = "Eb Garamond";
							break;
						case "monospace":
							cssStyle["--markdown-font-family"] = "Source Code Pro";
							break;
						case "playful":
							cssStyle["--markdown-font-family"] = "Lobster Two";
							break;
						case "holy":
							cssStyle["--markdown-font-family"] = "Cinzel";
							break;
						case "bubbly":
							cssStyle["--markdown-font-family"] = "Gluten";
							break;
						case "marker":
							cssStyle["--markdown-font-family"] = "Permanent Marker";
							break;
						case "gothic":
							cssStyle["--markdown-font-family"] = "Unifraktur Maguntia";
							break;
						case "stencil":
							cssStyle["--markdown-font-family"] = "Stick No Bills";
							break;
						case "mystery":
							cssStyle["--markdown-font-family"] = "Mountains of Christmas";
							break;
						case "italian":
							cssStyle["--markdown-font-family"] = "Playwrite IT Traditional";
							break;
						case "metal":
							cssStyle["--markdown-font-family"] = "Metal Mania";
							break;
						case "cutesy":
							cssStyle["--markdown-font-family"] = "Twinkle Stars";
							break;
						case "thin":
							cssStyle["--markdown-font-family"] = "Comic Neue";
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

					cssStyle["--markdown-font-variation-settings"] = (token.fontVarSettings as [string, number]).map(x => `"${x[0]}" ${x[1]}`).join(", ");
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