import { Fragment, h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import MarkdownSvg from "../../components/MarkdownSvg.vue";
import { isColor, isLength, isPercentage, splitArguments } from "./utils";

const svgExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [{
		name: "svg",
		level: "inline",
		start(src: string) { return src.match(/\[svg\]/)?.index; },
		tokenizer(src: string) {
			const rule = /^\[svg(.+?)?\](.+?)\[\/svg\]/;
			const match = rule.exec(src);
			if (match) {
				const { color, fill, stroke, strw } = splitArguments(match[1] || "");
				if(
					(color && !isColor(color)) ||
					(fill && !isColor(fill)) ||
					(stroke && !isColor(stroke)) ||
					(strw && !isLength(strw) && !isPercentage(strw))
				) return;

				const token = {
					type: "svg",
					raw: match[0],
					fill,
					stroke,
					strokeWidth: strw,
					color,
					href: match[2]
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