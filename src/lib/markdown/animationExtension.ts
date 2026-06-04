import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { splitList } from "./utils";

const permittedAnimations = [
	"rubberband",
	"tada",
	"bounce",
	"fall",
	"spin",
	"expand",
	"shrink",
	"rspin",
	"aspin",
	"spinX",
	"rspinX",
	"aspinX",
	"spinY",
	"rspinY",
	"aspinY",
	"jump",
	"twitch",
	"shake",
	"shake-v",
	"shake-h",
	"blink",
	"swing",
	"wobble",
	"jelly",
	"beat"
];

const animationExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "animation",
			level: "inline",
			start(src: string) { return src.match(/\[ani=/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[ani=(.+?)\](.+?)\[\/ani\]/;
				const match = rule.exec(src);
				if (match) {
					const [type, duration] = splitList(match[1]);
					if(!permittedAnimations.includes(type)) return;
					const token = {
						type: "animation",
						aniType: type,
						duration,
						raw: match[0],
						text: match[2],
						tokens: this.lexer.inlineTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("span", {
					class: "animation",
					"data-animation-type": token.aniType,
					style: token.duration ? `--markdown-animation-duration: ${token.duration}s` : undefined
				}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
			}
		}
	]
};

export default animationExtension;