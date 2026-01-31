import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import Marquee from "../../components/Marquee.vue";

const marqueeExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "marquee",
			level: "block",
			start(src: string) { return src.match(/\[mq=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[mq=(top|bottom|left|right)\](.+?)\[\/mq\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "marquee",
						raw: match[0],
						marquee: match[1],
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h(Marquee, {
					class: token.marquee
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default marqueeExtension;