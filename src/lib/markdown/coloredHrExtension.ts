import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isColor, isLength, isPercentage, splitList } from "./utils";

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
					const [ color, width, height, radius, ...p ] = splitList(match[1]);
					if(p.length) return;

					if (
						!isColor(color) || 
						(width && !isLength(width) && !isPercentage(width)) ||
						(height && !isLength(height) && !isPercentage(height)) ||
						(radius && !isLength(radius) && !isPercentage(radius))
					) return;

					const token = {
						type: "coloredHr",
						color,
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
						borderColor: token.color,
						color: token.color,
						backgroundColor: token.color,
						width: token.width,
						height: token.height,
						borderRadius: token.radius
					}
				});
			}
		}
	]
};

export default coloredHrExtension;