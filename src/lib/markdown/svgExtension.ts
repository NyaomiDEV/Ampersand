import { Fragment, h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import MarkdownSvg from "../../components/MarkdownSvg.vue";

const svgExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [{
		name: "svg",
		level: "inline",
		start(src: string) { return src.match(/\[svg\]/)?.index; },
		tokenizer(src: string) {
			const rule = /^\[svg(?: color=(?<color>.*?))?(?: fill=(?<fill>.*?))?(?: stroke=(?<stroke>.*?))?(?: strw=(?<strw>.*?))?\](?<src>.+?)\[\/svg\]/;
			const match = rule.exec(src);
			if (match) {
				const token = {
					type: "svg",
					raw: match[0],
					fill: match.groups?.fill,
					stroke: match.groups?.stroke,
					strokeWidth: match.groups?.strw,
					color: match.groups?.color,
					href: match.groups?.src
				};
				return token;
			}
			return;
		},
		renderer(token) {
			if (!token.blocked){
				return h(MarkdownSvg, {
					src: token.href,
					fill: token.fill ?? "transparent",
					stroke: token.stroke ?? "currentColor",
					strokeWidth: token.strokeWidth,
					color: token.color ?? "currentColor",
				});
			} else 
				return h(Fragment, []);
		},
	}]
};

export default svgExtension;