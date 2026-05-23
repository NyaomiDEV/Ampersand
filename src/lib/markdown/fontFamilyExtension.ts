import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import MarkdownFontFamily from "../../components/MarkdownFontFamily.vue";

// TODO: Remove
const legacyFontNames = {
	cursive: "Rochester",
	pixel: "Departure Mono",
	dots: "Bitcount Single",
	digital: "Orbitron",
	handwritten: "Shantell Sans",
	serif: "EB Garamond",
	typewriter: "TT2020",
	monospace: "JetBrains Mono",
	playful: "Lobster Two",
	holy: "Cinzel",
	bubbly: "Gluten",
	marker: "Permanent Marker",
	gothic: "KJV1611",
	stencil: "Saira Stencil",
	mystery: "Mystery Quest",
	italian: "Playwrite IT Traditional",
	metal: "Metal Mania",
	cutesy: "Twinkle Star",
	indie: "Amatic SC",
	deco: "Ribeye Marrow",
	pop: "Unbounded",
	terminal: "Workbench",
	western: "Rye",
	glitch: "Rubik Glitch",
	varsity: "Graduate",
	stripes: "Big Shoulders Inline",
	futuristic: "Audiowide",
	drip: "Rubik Wet Paint",
	pineapple: "Some Time Later",
	cracks: "Rubik Distressed",
};

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
					const fontFamily = legacyFontNames[token.fontFamily] || token.fontFamily;
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