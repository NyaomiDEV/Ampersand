import { h } from "vue";
import MemberChip from "../../components/member/MemberChip.vue";
import { MarkedExtension } from "../../../vendor/marked-vue/marked";
import { getMembers } from "../db/tables/members";

const mentionExtension: MarkedExtension = {
	extensions: [{
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
	}],
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
		}
	}
};

export default mentionExtension;