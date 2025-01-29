import { h } from "vue";
import { Marked, TokenizerAndRendererExtension } from "../../vendor/marked-vue/marked";
import { getMembers } from "../lib/db/tables/members";
import MemberChip from "../components/member/MemberChip.vue";

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
				member: token.member
			});
		} else {
			return h('span', token.raw);
		}
	}
};

marked.use({
	extensions: [mention],
	async: true,
	async walkTokens(token) {
		if (token.type === "mention") {
			switch (token.mentionedType) {
				case "member":
					token.member = (await getMembers()).find(x => x.uuid === token.uuid);
					break;
			}
		}
	},
});
