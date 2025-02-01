import { Fragment, h } from "vue";
import { Marked, TokenizerAndRendererExtension } from "../../vendor/marked-vue/marked";
import { getMembers } from "../lib/db/tables/members";
import MemberChip from "../components/member/MemberChip.vue";
import { getAssets } from "./db/tables/assets";
import { getObjectURL } from "./util/blob";

export const marked = new Marked();

const mention: TokenizerAndRendererExtension = {
	name: "mention",
	level: "inline",
	start(src: string) { return src.match(/@</)?.index; },
	tokenizer(src: string) {
		const rule = /^@<([m]):(.+?)>/;
		const match = rule.exec(src);
		if (match) {
			let mentionedType: string = "";
			switch (match[1]) {
				case "m":
					mentionedType = "member";
					break;
			}
			const token = {
				type: 'mention',
				raw: match[0],
				mentionedType,
				uuid: match[2],
				tokens: []
			};
			return token;
		}
		return;
	},
	renderer(token) {
		if (token.member) {
			return h(MemberChip, {
				member: token.member,
				clickable: true
			});
		} else {
			return h('span', token.raw);
		}
	}
};

const spoiler: TokenizerAndRendererExtension = {
	name: "spoiler",
	level: "inline",
	start(src: string) { return src.match(/\|\|/)?.index; },
	tokenizer(src: string) {
		const rule = /^\|\|(.+?)\|\|/;
		const match = rule.exec(src);
		if (match) {
			const token = {
				type: 'spoiler',
				raw: match[0],
				text: match[1],
				tokens: this.lexer.inlineTokens(match[1])
			};
			return token;
		}
		return;
	},
	renderer(token) {
		return h('span', {
			tabindex: -1,
			class: "spoiler"
		}, token.tokens && token.tokens.length ? this.parser.parseInline(token.tokens) : token.text);
	}
};

marked.use({
	extensions: [mention, spoiler],
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
			case "mention":
				switch (token.mentionedType) {
					case "member":
						token.member = (await getMembers()).find(x => x.uuid === token.uuid);
						break;
				}
				break;
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
