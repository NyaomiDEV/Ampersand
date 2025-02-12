import { Fragment, h } from "vue";
import { Marked } from "../../../vendor/marked-vue/marked";
import { getAssets } from "../db/tables/assets";
import { getObjectURL } from "../util/blob";
import mentionExtension from "./mentionExtension";
import spoilerExtension from "./spoilerExtension";
import timestampExtension from "./timestampExtension";
import colorExtension from "./colorExtension";

export const marked = new Marked();

// Override image and link renderers
marked.use({
	renderer: {
		image(token) {
			// checking for lone surrogates the shitty way
			try {
				const href = encodeURI(token.href).replace(/%25/g, '%');
				return h('img', {
					src: href,
					alt: token.text,
					title: token.title,
					width: (token as any).width,
					height: (token as any).height
				});
			} catch (e) {
				return h(Text, token.text);
			}
		},
		link(token) {
			const inlineParsed = this.parser.parseInline(token.tokens);
			// checking for lone surrogates the shitty way
			try{
				const href = encodeURI(token.href).replace(/%25/g, '%');
				return h('a', { href, title: token.title }, inlineParsed);
			}catch(e){
				return h(Fragment, inlineParsed);
			}
		},
	},
	async: true,
	async walkTokens(token) {
		switch(token.type){
			case "image":
				// first off let's match the size tokens
				const matches = /#(-?\d+?x-?\d+?)$/.exec(token.href);
				if(matches){
					const [w,h] = matches[1].split("x").map(x => Number(x));
					if(w >= 0) (token as any).width = w;
					if(h >= 0) (token as any).height = h;
					token.href = token.href.replace(/#(-?\d+?x-?\d+?)$/, "");
				}

				// then let's put the href to asset code
				if(token.href.startsWith("@")){
					const friendlyNameMaybe = token.href.slice(1);
					const asset = (await getAssets()).find(x => x.friendlyName === friendlyNameMaybe);
					if(asset){
						token.href = getObjectURL(asset.file);
					}
				}
				break;
			case "link":
				if (token.href.startsWith("@")) {
					const friendlyNameMaybe = token.href.slice(1);
					const asset = (await getAssets()).find(x => x.friendlyName === friendlyNameMaybe);
					if (asset) {
						token.href = getObjectURL(asset.file);
					}
				}
				break;				
		}
	},
});

// Start injecting our extensions
marked.use(
	mentionExtension,
	spoilerExtension,
	timestampExtension,
	colorExtension
);