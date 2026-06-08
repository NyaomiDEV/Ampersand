import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import Marquee from "../../components/Marquee.vue";
import { splitList } from "./utils";

const marqueeExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "marquee",
			level: "block",
			start(src: string) { return src.match(/^\[mq=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[mq=(.+?)\]([\s\S]+?)\[\/mq\]/;
				const match = rule.exec(src);
				if (match) {
					const parts = splitList(match[1] || "");
					const direction = parts.find(x => ["top", "bottom", "left", "right"].includes(x));
					if(!direction) return;
					const isBouncy = parts.indexOf("bouncy") > 0;
					const duration = parts.find(x => x.match(/\d*\.?\d+s/) !== null);

					const token = {
						type: "marquee",
						raw: match[0],
						direction,
						duration: duration ? parseFloat(duration.replaceAll("s", "")) : undefined,
						bouncy: isBouncy,
						text: match[2],
						tokens: this.lexer.blockTokens(match[2])
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
				}, () => token.tokens && token.tokens.length ? this.parser.parse(token.tokens) : token.text);
			}
		}
	]
};

export default marqueeExtension;