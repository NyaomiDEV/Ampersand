import { h, type VNode } from "vue";
import MemberChip from "../../components/member/MemberChip.vue";
import JournalChip from "../../components/JournalChip.vue";
import { MarkedExtension } from "marked";
import { getMember } from "../db/tables/members";
import { getJournalPost } from "../db/tables/journalPosts";

const mentionExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [{
		name: "mention",
		level: "inline",
		start(src: string) { return src.match(/@</)?.index; },
		tokenizer(src: string) {
			const rule = /^@<([mj]):(.+?)>/;
			const match = rule.exec(src);
			if (match) {
				let mentionedType: string = "";
				switch (match[1]) {
					case "m":
						mentionedType = "member";
						break;

					case "j":
						mentionedType = "journal";
						break;
				}
				const token = {
					type: "mention",
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
			} else if (token.post) {
				return h(JournalChip, {
					post: token.post,
					clickable: true
				});
			} else 
				return h("span", token.raw);
		}
	}],
	async: true,
	async walkTokens(token) {
		switch(token.type){
			case "mention":
				switch (token.mentionedType) {
					case "member":
						token.member = await getMember(token.uuid);
						break;

					case "journal":
						token.post = await getJournalPost(token.uuid);
						break;
				}
				break;
		}
	}
};

export default mentionExtension;