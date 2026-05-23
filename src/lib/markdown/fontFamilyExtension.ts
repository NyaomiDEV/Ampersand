import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import MarkdownFontFamily from "../../components/MarkdownFontFamily.vue";
import { fontFamilies, fontQuickNames } from "../util/misc";

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
					const _para = match[1].split(":");
					let family = _para.shift();
					if(!family) return;

					family = family in fontQuickNames ? fontQuickNames[family] as string : family;

					const parameters = _para.map(x => {
						const parts = x.trim().split(" ");
						return [parts[0].toUpperCase(), parseFloat(parts[1])];
					}).filter(x => !!x);

					if(!family.startsWith("@") && !fontFamilies.includes(family)) return;

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
					const fontFamily = token.fontFamily;
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