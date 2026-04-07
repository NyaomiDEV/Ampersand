import { h, type VNode } from "vue";
import MemberChip from "../../components/member/MemberChip.vue";
import JournalChip from "../../components/journal/JournalChip.vue";
import SystemChip from "../../components/system/SystemChip.vue";
import TagChip from "../../components/tag/TagChip.vue";
import { MarkedExtension } from "marked";
import { getMember } from "../db/tables/members";
import { getJournalPost } from "../db/tables/journalPosts";
import { getSystem } from "../db/tables/system";
import { getTag } from "../../lib/db/tables/tags";

const mentionExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [{
		name: "mention",
		level: "inline",
		start(src: string) { return src.match(/@</)?.index; },
		tokenizer(src: string) {
			const rule = /^@<([mjst]):(.+?)>/;
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

					case "s":
						mentionedType = "system";
						break;

					case "t":
						mentionedType = "tag";
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
			} else if (token.system) {
				return h(SystemChip, {
					system: token.system,
					clickable: true
				});
			} else if (token.tag) {
				return h(TagChip, {
					tag: token.tag,
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
						try {
							token.member = await getMember(token.uuid);
						} catch(e) {
							console.error(e);
						}
						break;

					case "journal":
						try {
							token.post = await getJournalPost(token.uuid);
						} catch(e) {
							console.error(e);
						}
						break;

					case "system":
						try {
							token.system = await getSystem(token.uuid);
						} catch (e) {
							console.error(e);
						}
						break;

					case "tag":
						try {
							token.tag = await getTag(token.uuid);
						} catch (e) {
							console.error(e);
						}

						break;
				}
				break;
		}
	}
};

export default mentionExtension;