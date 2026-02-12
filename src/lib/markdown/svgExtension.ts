import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { getAssets } from "../db/tables/assets";
import { getObjectURL } from "../util/blob";
import { securityConfig } from "../config";
import Svg from "../../components/Svg.vue";

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
				return h(Svg, {
					src: token.href,
					fill: token.fill ?? "transparent",
					stroke: token.stroke ?? "currentColor",
					strokeWidth: token.strokeWidth ?? "0px",
					color: token.color ?? "currentColor",
				});
			} else 
				return undefined;
		},
	}],
	async: true,
	async walkTokens(token) {
		switch(token.type){
			case "svg":
				// let's put the href to asset code
				if ((token.href as string).startsWith("@")) {
					token.blocked = true; // block beforehand since the asset may not exist
					const [assetNameMaybe, ...parts] = (token.href as string).slice(1).split("#");
					for await (const x of getAssets()) {
						if (x.friendlyName === assetNameMaybe) {
							token.href = getObjectURL(x.file) + (parts.length ? `#${parts.join("#")}` : "");
							token.blocked = false; // unblock now
							break;
						}
					}
					// also, block non-asset images as they are sure linking outwards
				} else {
					if (!securityConfig.allowRemoteContent)
						token.blocked = true; // block if we don't have internet permission
				}
				break;
		}
	}
};

export default svgExtension;