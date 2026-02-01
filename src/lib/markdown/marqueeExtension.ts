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
				const rule = /^\[mq=(?<direction>top|bottom|left|right) (?<duration>\d*\.?\d+)s(?: (?<bouncy>bouncy))?\](?<text>.+?)\[\/mq\]/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "marquee",
						raw: match[0],
						direction: match.groups?.direction,
						duration: match.groups?.duration ? parseFloat(match.groups.duration) : undefined,
						bouncy: !!match.groups?.bouncy,
						text: match.groups?.text,
						tokens: this.lexer.inlineTokens(match.groups!.text)
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h(Marquee, {
					direction: token.direction,
					duration: token.duration,
					bouncy: token.bouncy
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				}, () => token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default marqueeExtension;