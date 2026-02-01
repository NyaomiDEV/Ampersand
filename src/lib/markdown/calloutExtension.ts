import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

const calloutExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "callout",
			level: "block",
			start(src: string) { return src.match(/:::/)?.index; },
			tokenizer(src: string) {
				const rule = /^:::(?: \{(?<color>.+?)\})?(?: (?<title>.+?))?\n(?<text>[\S\s]+?)\n:::(?:\n|$)/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "callout",
						raw: match[0],
						color: match.groups?.color,
						text: match.groups?.text,
						tokens: this.lexer.inlineTokens(match.groups!.text)
					};
					if(match.groups?.title){
						token.tokens.unshift({
							type: "callout-title",
							raw: match.groups?.title,
							tokens: this.lexer.inlineTokens(match.groups.title)
						});
					}
					return token;
				}
				return;
			},
			renderer(token) {				
				return h("div", { class: "callout", style: token.color ? `--markdown-callout-color: ${token.color}` : "" },
					token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text
				);
			}
		},
		{
			name: "callout-title",
			level: "inline",
			renderer(token) {
				return h("span", { class: "callout-title" },
					token.tokens && token.tokens.length
						? this.parser.parseInline(token.tokens)
						: token.raw
				);
			}
		}
	]
};

export default calloutExtension;