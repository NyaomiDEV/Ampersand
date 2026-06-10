import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { getAmpersandMarkdownRegex, isLength, isPercentage, splitList } from "./utils";

const borderRadiusExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "radiusInline",
			level: "inline",
			start(src: string) { return src.match(/\[radius=/)?.index; },
			tokenizer(src: string) {
				const rule = getAmpersandMarkdownRegex("radius", /.+?/);
				const match = rule.exec(src);
				if (match) {
					const radius = splitList(match[1]);

					if (!radius.every(x => isLength(x) || isPercentage(x))) return;

					const token = {
						type: "radiusInline",
						raw: match[0],
						radius,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-border-radius: ${(token.radius as string[]).join(" ")}`;
				return h("markdown-predicate", {
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
		{
			name: "radius",
			level: "block",
			start(src: string) { return src.match(/^\[radius=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[radius=(.+?)\]([\s\S]+?)\[\/radius\]/;
				const match = rule.exec(src);
				if (match) {
					const radius = splitList(match[1]);

					if (!radius.every(x => isLength(x) || isPercentage(x))) return;

					const token = {
						type: "radius",
						raw: match[0],
						radius,
						text: match[2],
						tokens: this.lexer.blockTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-border-radius: ${(token.radius as string[]).join(" ")}`;
				return h("markdown-predicate", {
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parse(token.tokens) : token.text);
			}
		},
	]
};

export default borderRadiusExtension;