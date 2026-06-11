import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { getAmpersandMarkdownRegex, isLength, isPercentage, splitList } from "./utils";

const marginExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "marginInline",
			level: "inline",
			start(src: string) { return src.match(/\[margin=/)?.index; },
			tokenizer(src: string) {
				const rule = getAmpersandMarkdownRegex("margin", /.+?/);
				const match = rule.exec(src);
				if (match) {
					const margin = splitList(match[1]);

					if (!margin.every(x => isLength(x) || isPercentage(x))) return;

					const token = {
						type: "marginInline",
						raw: match[0],
						margin,
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-margin: ${(token.margin as string[]).join(" ")}`;
				return h("markdown-predicate", {
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		},
		{
			name: "margin",
			level: "block",
			start(src: string) { return src.match(/^\[margin=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[margin=(.+?)\]([\s\S]+?)\[\/margin\]/;
				const match = rule.exec(src);
				if (match) {
					const margin = splitList(match[1]);

					if (!margin.every(x => isLength(x) || isPercentage(x))) return;

					const token = {
						type: "margin",
						raw: match[0],
						margin,
						text: match[2],
						tokens: this.lexer.blockTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const cssStyle = `--markdown-margin: ${(token.margin as string[]).join(" ")}`;
				return h("markdown-predicate", {
					style: cssStyle
				}, token.tokens && token.tokens.length ? this.parser.parse(token.tokens) : token.text);
			}
		},
	]
};

export default marginExtension;