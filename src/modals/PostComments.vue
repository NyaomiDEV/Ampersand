<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonList,
		IonModal,
		IonFab,
		IonFabButton,
		IonIcon,
		alertController,
		IonItemSliding,
		IonItemOptions,
		IonItemOption,
	} from "@ionic/vue";

	import { h, onBeforeMount, onUnmounted, ref, shallowRef, toRaw, useTemplateRef } from "vue";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import type { Member, Comment, JournalPostComplete } from "../lib/db/entities";
	import { updateJournalPost } from "../lib/db/tables/journalPosts.ts";
	import { defaultMember, getMember } from "../lib/db/tables/members.ts";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events.ts";
	import { addModal, removeModal } from "../lib/modals.ts";
	import { formatDate, promptOkCancel, sortDateAsc } from "../lib/util/misc.ts";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import MemberItem from "../components/member/MemberItem.vue";
	import MemberSelect from "./MemberSelect.vue";
	import { useTranslation } from "i18next-vue";

	const i18next = useTranslation();

	const props = defineProps<{
		post: JournalPostComplete
	}>();

	const members = shallowRef<Member[]>();
	const post = ref(props.post);

	const list = useTemplateRef("list");

	async function getCommentMembers(){
		const commentMemberUUIDs = post.value.comments?.map(x => x.member) || [];

		members.value = (await Promise.all(
			commentMemberUUIDs.map(async x => await getMember(x))
		)).filter(x => !!x);
	}

	function closeSlidingItems() {
		const el: globalThis.HTMLIonListElement = list.value?.$el;
		if(!el) return;
		const items = el.querySelectorAll<globalThis.HTMLIonItemSlidingElement>("ion-item-sliding");
		items?.forEach(i => void i.closeOpened());
	}

	function getCommenter(): Promise<Member | undefined> {
		return new Promise(resolve => {
			void (async () => {
				let member: Member | undefined;
				const vnode = h(MemberSelect, {
					onlyOne: true,
					discardOnSelect: true,
					hideCheckboxes: true,
					customTitle: i18next.t("other:comments.commenter"),
					onDidDismiss: () => {
						removeModal(vnode);
						resolve(member);
					},
					"onUpdate:modelValue": v => { if(v[0]) member = v[0]; },
				});

				const modal = await addModal(vnode);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
				await (modal.el as any).present();
			})();
		});
	}

	function showCommentAlert(oldBody?: string): Promise<string | undefined>{
		return new Promise((resolve) => {
			void (async () => {
				const alert = await alertController.create({
					header: i18next.t("other:comments.comment"),
					buttons: [
						{
							text: i18next.t("other:alerts.cancel"),
							role: "cancel",
							handler: () => resolve(undefined)
						},
						{
							text: i18next.t("other:alerts.ok"),
							role: "confirm",
							handler: (e) => resolve(e.comment.length ? e.comment : null)
						}
					],
					inputs: [
						{
							name: "comment",
							type: "textarea",
							attributes: {
								rows: 4
							},
							value: oldBody,
							placeholder: i18next.t("other:comments.commentHint")
						}
					]
				});

				await alert.present();
			})();
		});
	}

	async function addComment(){
		const commenter = await getCommenter();
		if(!commenter) return;

		const commentBody = await showCommentAlert();
		if(!commentBody) return;

		const comment: Comment = {
			date: new Date(),
			comment: commentBody,
			member: commenter.uuid
		};

		post.value.comments?.push(comment);

		await updateJournalPost({ ...toRaw(post.value), members: post.value.members.map(x => x.uuid) });
	}

	async function deleteComment(comment: Comment){
		closeSlidingItems();
		if(await promptOkCancel(i18next.t("other:comments.deleteConfirmation"))){
			post.value.comments?.splice(
				post.value.comments.indexOf(comment),
				1
			);
			await updateJournalPost({ ...toRaw(post.value), members: post.value.members.map(x => x.uuid) });
		}
	}

	async function modifyComment(comment: Comment){
		closeSlidingItems();
		const newBody = await showCommentAlert(comment.comment);
		if(!newBody) return;

		comment.comment = newBody;
		await updateJournalPost({ ...toRaw(post.value), members: post.value.members.map(x => x.uuid) });
	}

	const listener = (event: Event) => {
		if(["members", "journalPosts"].includes((event as DatabaseEvent).data.table))
			void getCommentMembers();
	};

	onBeforeMount(async () => {
		if(!post.value.comments)
			post.value.comments = [];

		DatabaseEvents.addEventListener("updated", listener);
		await getCommentMembers();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});
</script>

<template>
	<IonModal class="poll-results-modal" :breakpoints="[0,0.75,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("other:comments.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!members || !post.comments" />
		<IonContent v-else>
			<IonList ref="list">
				<template v-for="comment in post.comments.toSorted(sortDateAsc)" :key="post.comments.indexOf(comment)">
					<IonItemSliding>
						<MemberItem
							:member="members.find(x => comment.member === x.uuid) || defaultMember()"
							:show-cover="false"
							:show-role="false"
							:show-pronouns="false"
						>
							<h3 class="comment">{{ comment.comment }}</h3>
							<p>{{ formatDate(comment.date, "collapsed") }}</p>
						</MemberItem>
						<IonItemOptions>
							<IonItemOption color="secondary" @click="modifyComment(comment)">
								<IonIcon slot="icon-only" :icon="pencilMD" />
							</IonItemOption>
							<IonItemOption color="danger" @click="deleteComment(comment)">
								<IonIcon slot="icon-only" :icon="trashMD" />
							</IonItemOption>
						</IonItemOptions>
					</IonItemSliding>
				</template>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="addComment">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	.comment {
		text-wrap: wrap !important;
		overflow: visible !important;
	}

	ion-list {
		gap: 8px;
	}

	ion-item {
		--background: transparent;
		--min-height: 0px;

		> :deep(.avatar) {
			width: 36px;
			height: 36px;
			align-self: flex-end;
			margin-bottom: 1em;
		}

		> :deep(ion-label) {
			margin: 0;
		}
	}

	ion-item::part(inner) {
		background-color: rgb(var(--md3-surface-container));
		padding: 8px 16px;
		border-radius: 16px;
		border-bottom-left-radius: 0;
		width: min-content;
		overflow: visible;
	}

	:dir(rtl) ion-item::part(inner){
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 16px;
	}

	ion-item::part(inner)::before {
		content: "\A";
		position: absolute;
		left: -16px;
		bottom: 0;
		background-color: rgb(var(--md3-surface-container));
		width: 16px;
		height: 16px;
		clip-path: path("M16 16H0C8.83656 16 16 8.83656 16 0V16Z");
	}

	:dir(rtl) ion-item::part(inner)::before {
		left: unset;
		right: -16px;
		transform: scaleX(-100%);
	}
</style>