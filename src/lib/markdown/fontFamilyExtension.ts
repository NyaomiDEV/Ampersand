import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import MarkdownFontFamily from "../../components/MarkdownFontFamily.vue";

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
						const parts = x.trim().split(" ");
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
					let fontFamily = token.fontFamily;
					switch((token.fontFamily as string).toLowerCase()){
						case "cursive":
							fontFamily = "Rochester";
							break;
						case "pixel":
							fontFamily = "Departure Mono";
							break;
						case "dots":
							fontFamily = "Bitcount Single";
							break;
						case "digital":
							fontFamily = "Orbitron";
							break;
						case "handwritten":
							fontFamily = "Shantell Sans";
							break;
						case "serif":
							fontFamily = "Eb Garamond";
							break;
						case "typewriter":
							fontFamily = "TT2020";
							break;
						case "monospace":
							fontFamily = "JetBrains Mono";
							break;
						case "playful":
							fontFamily = "Lobster Two";
							break;
						case "holy":
							fontFamily = "Cinzel";
							break;
						case "bubbly":
							fontFamily = "Gluten";
							break;
						case "marker":
							fontFamily = "Permanent Marker";
							break;
						case "gothic":
							fontFamily = "KJV1611";
							break;
						case "stencil":
							fontFamily = "Stick No Bills";
							break;
						case "mystery":
							fontFamily = "Mystery Quest";
							break;
						case "italian":
							fontFamily = "Playwrite IT Traditional";
							break;
						case "metal":
							fontFamily = "Metal Mania";
							break;
						case "cutesy":
							fontFamily = "Twinkle Stars";
							break;
						case "indie":
							fontFamily = "Amatic SC";
							break;
						case "deco":
							fontFamily = "Ribeye Marrow";
							break;
						case "terminal":
							fontFamily = "Workbench";
							break;
						case "western":
							fontFamily = "Rye";
							break;
						case "glitch":
							fontFamily = "Rubik Glitch";
							break;
						case "stripes":
							fontFamily = "Zen Tokyo Zoo";
							break;
						case "drip":
							fontFamily = "Rubik Wet Paint";
							break;
						case "cracks":
							fontFamily = "Rubik Distressed";
							break;
						case "comic":
							fontFamily = "Comic Relief";
							break;
						case "lexend":
							fontFamily = "Lexend";
							break;
						case "atkinson":
							fontFamily = "Atkinson Hyperlegible";
							break;
						case "dyslexic":
							fontFamily = "OpenDyslexic";
							break;
						case "inter":
							fontFamily = "Inter";
							break;
					}

					const fontVariation = (token.fontVarSettings as [string, number]).map(x => `"${x[0]}" ${x[1]}`).join(", ");
					return h(MarkdownFontFamily, {
						fontFamily,
						fontVariation
					}, token.tokens && token.tokens.length ? () => this.parser.parseInline(token.tokens!) : () => token.text as string);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default fontFamilyExtension;