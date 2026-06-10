import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { getAmpersandMarkdownRegex, isLength, isPercentage, splitList } from "./utils";

const paddingExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "paddingInline",
			level: "inline",
			start(src: string) { return src.match(/\[padding=/)?.index; },
			tokenizer(src: string) {
				const rule = getAmpersandMarkdownRegex("padding", /.+?/);
				const match = rule.exec(src);
				if (match) {
					const padding = splitList(match[1]);

					if (!padding.every(x => isLength(x) || isPercentage(x))) return;

					const token = {
						type: "paddingInline",
						raw: match[0],
						padding,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-padding: ${(token.padding as string[]).join(" ")}`;
				return h("markdown-predicate", {
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
		{
			name: "padding",
			level: "block",
			start(src: string) { return src.match(/^\[padding=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[padding=(.+?)\]([\s\S]+?)\[\/padding\]/;
				const match = rule.exec(src);
				if (match) {
					const padding = splitList(match[1]);

					if (!padding.every(x => isLength(x) || isPercentage(x))) return;

					const token = {
						type: "padding",
						raw: match[0],
						padding,
						text: match[2],
						tokens: this.lexer.blockTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-padding: ${(token.padding as string[]).join(" ")}`;
				return h("markdown-predicate", {
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parse(token.tokens) : token.text);
			}
		},
	]
};

export default paddingExtension;