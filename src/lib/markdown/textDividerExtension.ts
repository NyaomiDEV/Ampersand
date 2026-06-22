import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isBorderStyle, isColor, splitList } from "./utils";

const textDividerExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "textDivider",
			level: "block",
			start(src: string) { return src.match(/^--\[/)?.index; },
			tokenizer(src: string) {
				const rule = /^--\[(.+?)\]--(?:\n+|$)/;
				const match = rule.exec(src);
				if (match) {
					const values = splitList(match[1]);
					let color = "currentColor";
					let alignment = "center";
					let style = "solid";
					let textStart = 0;

					if(isColor(values[0])){
						color = values.shift()!;
						textStart++;
					}

					if(["left", "center", "right"].includes(values[0])){
						alignment = values.shift()!;
						textStart++;
					}

					if(isBorderStyle(values[0])) {
						style = values.shift()!;
						textStart++;
					}

					let offset = 0;
					for(let i = 0; i < textStart; i++)
						offset = match[1].indexOf(":", offset) + 1;

					const text = match[1].substring(offset);

					const token = {
						type: "textDivider",
						color,
						alignment,
						style,
						text,
						tokens: this.lexer.inlineTokens(text),
						raw: match[0]
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("div", {
					class: ["markdown-text-divider", token.alignment, token.style],
					style: {
						color: token.color,
						"--markdown-text-divider-style": token.style
					}
				}, h("span", {}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text));
			}
		}
	]
};

export default textDividerExtension;