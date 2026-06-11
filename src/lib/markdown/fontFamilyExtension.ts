import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import MarkdownFontFamily from "../../components/MarkdownFontFamily.vue";
import { fontFamilies, fontQuickNames } from "../util/misc";
import { getAmpersandMarkdownRegex } from "./utils.ts";

const fontFamilyExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "fontFamily",
			level: "inline",
			start(src: string) { return src.match(/\[ff=/)?.index; },
			tokenizer(src: string) {
				const rule = getAmpersandMarkdownRegex("ff", /.+?/);
				const match = rule.exec(src);
				if (match) {
					const _para = match[1].split(":");
					let family = _para.shift();
					if(!family) return;

					family = family in fontQuickNames ? fontQuickNames[family] as string : family;

					const fontFeatSettings: [string, number][] = [];
					const fontVarSettings: [string, number][] = [];
					
					for (const parameter of _para.map(x => {
						const parts = x.trim().split(" ");
						return [parts[0], parts[1] ? parseFloat(parts[1]) : 1] as [string, number];
					})){
						if(parameter[0].startsWith("-"))
							fontFeatSettings.push([parameter[0].slice(1), parameter[1]]);
						else 
							fontVarSettings.push(parameter);
					}

					if(!family.startsWith("@") && !fontFamilies.includes(family)) return;

					const token = {
						type: "fontFamily",
						raw: match[0],
						fontFamily: family,
						fontFeatSettings,
						fontVarSettings,
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
					const fontFeature = (token.fontFeatSettings as [string, number]).map(x => `"${x[0]}" ${x[1]}`).join(", ");
					const fontVariation = (token.fontVarSettings as [string, number]).map(x => `"${x[0]}" ${x[1]}`).join(", ");
					return h(MarkdownFontFamily, {
						fontFamily,
						fontFeature,
						fontVariation
					}, token.tokens && token.tokens.length ? () => this.parser.parseInline(token.tokens!) : () => token.text as string);
				}

				return h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default fontFamilyExtension;