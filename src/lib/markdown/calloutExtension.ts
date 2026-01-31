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
						title: match.groups?.title,
						text: match.groups?.text,
						tokens: this.lexer.inlineTokens(match.groups!.text)
					};
					return token;
				}
				return;
			},
			renderer(token) {				
				return h("div", { class: "callout", style: token.color ? `--markdown-callout-color: ${token.color}` : "" }, 
					[
						token.title ? h("span", { class: "callout-title" }, token.title) : undefined,
						h("div", { class: "callout-content" }, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text)
					]
				);
			}
		}
	]
};

export default calloutExtension;