import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { getAssets } from "../db/tables/assets";
import { getObjectURL } from "../util/blob";
import { securityConfig } from "../config";
import { IonIcon } from "@ionic/vue";

const svgExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [{
		name: "svg",
		level: "inline",
		start(src: string) { return src.match(/\[svg\]/)?.index; },
		tokenizer(src: string) {
			const rule = /^\[svg\](.+?)\[\/svg\]/;
			const match = rule.exec(src);
			if (match) {
				const token = {
					type: "svg",
					raw: match[0],
					href: match[1]
				};
				return token;
			}
			return;
		},
		renderer(token) {
			if(!token.blocked){
				console.log(token.href);
				return h(IonIcon, {
					src: token.href
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
					const [assetNameMaybe, ...parts] = (token.href as string).slice(1).split("#");
					for await (const x of getAssets()) {
						if (x.friendlyName === assetNameMaybe) {
							token.href = getObjectURL(x.file) + (parts.length && `#${parts.join("#")}`);
							break;
						}
					}
					// also, block non-asset images as they are sure linking outwards
				} else {
					if (!securityConfig.allowRemoteContent)
						token.blocked = true;
				}
				break;
		}
	}
};

export default svgExtension;