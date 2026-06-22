import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isBorderStyle, isColor, isLength, isPercentage, splitList } from "./utils";

const coloredHrExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "coloredHr",
			level: "block",
			start(src: string) { return src.match(/^--\{/)?.index; },
			tokenizer(src: string) {
				const rule = /^--\{(.+?)\}--(?:\n+|$)/;
				const match = rule.exec(src);
				if (match) {
					const [ color, style, width, height, radius, ...p ] = splitList(match[1]);
					if(p.length) return;

					if (
						!isColor(color) || 
						(style && !isBorderStyle(style)) ||
						(width && !isLength(width) && !isPercentage(width)) ||
						(height && !isLength(height) && !isPercentage(height)) ||
						(radius && !isLength(radius) && !isPercentage(radius))
					) return;

					const token = {
						type: "coloredHr",
						color,
						style,
						width,
						height,
						radius,
						raw: match[0]
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h("hr", {
					style: {
						borderTopColor: token.color,
						borderTopStyle: token.style || "solid",
						width: token.width,
						borderRadius: token.radius,
						borderTopWidth: token.height || "1px",
					}
				});
			}
		}
	]
};

export default coloredHrExtension;