<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonFab,
		IonButtons,
		IonButton,
		IonLabel,
		IonTextarea,
		IonList,
		IonFabButton,
		IonBackButton,
		useIonRouter,
		IonPage,
		IonInput,
		IonItem,
		IonFooter,
		IonProgressBar,
		ActionSheetButton,
		actionSheetController,
	} from "@ionic/vue";

	import pencilMD from "@material-symbols/svg-600/rounded/edit.svg";
	import saveMD from "@material-symbols/svg-600/rounded/save.svg";
	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";
	import settingsMD from "@material-symbols/svg-600/rounded/settings.svg";
	import personAddMD from "@material-symbols/svg-600/rounded/person_add.svg";
	import clockAddMD from "@material-symbols/svg-600/rounded/more_time.svg";
	import exportMD from "@material-symbols/svg-600/rounded/file_export.svg";
	import fileMD from "@material-symbols/svg-600/rounded/attach_file_add.svg";
	import imageMD from "@material-symbols/svg-600/rounded/add_photo_alternate.svg";
	import accountCircle from "@material-symbols/svg-600/rounded/account_circle-fill.svg";

	import { JournalPost, JournalPostComplete, Member, Tag, UUIDable } from "../../lib/db/entities";
	import { newJournalPost, updateJournalPost, getJournalPost, toJournalPostComplete } from "../../lib/db/tables/journalPosts";
	import { formatDate, saveImageFile, sortDate, sortName, toast } from "../../lib/util/misc";
	import { getResizedImage } from "../../lib/util/image";
	import { getCurrentInstance, h, onBeforeMount, ref, shallowRef, toRaw, useTemplateRef, watch } from "vue";
	import Markdown from "../../components/Markdown.vue";
	import TagChip from "../../components/tag/TagChip.vue";
	import MemberSelect from "../../modals/MemberSelect.vue";
	import JournalOptions from "../../modals/JournalOptions.vue";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { useBlob } from "../../lib/util/blob";
	import { getTags } from "../../lib/db/tables/tags";
	import { addModal, removeModal } from "../../lib/modals";
	import MemberChip from "../../components/member/MemberChip.vue";
	import Comments from "../../modals/Comments.vue";
	import Loading from "../../modals/Loading.vue";
	import { accessibilityConfig } from "../../lib/config/index";
	import { addMaterialColors, rgbaToArgb, unsetMaterialColors } from "../../lib/theme/index";
	import AvatarStack from "../../components/AvatarStack.vue";
	import { getMember, defaultMember } from "../../lib/db/tables/members";
	import { useTranslation } from "i18next-vue";
	import { quickAddAsset } from "../../lib/db/tables/assets.ts";

	const { getObjectURL } = useBlob();
	const router = useIonRouter();
	const route = useRoute();
	const i18next = useTranslation();

	const loading = ref(false);
	const loadingBar = ref(false);

	const memberSelectModal = useTemplateRef("memberSelectModal");
	const memberTagModal = useTemplateRef("memberTagModal");
	const postComments = useTemplateRef("postComments");
	const loadingModal = useTemplateRef("loadingModal");

	const bodyTextarea = useTemplateRef("bodyTextarea");

	const postCommentAvatars = shallowRef<InstanceType<typeof AvatarStack>["$props"]["avatars"]>();

	const tags = shallowRef<Tag[]>([]);
	const self = getCurrentInstance();

	const emptyPost: PartialBy<JournalPostComplete, keyof UUIDable> = {
		title: "",
		members: [],
		date: new Date(),
		body: "",
		tags: [],
		isPrivate: false,
		isPinned: false
	};

	const post = ref({ ...emptyPost });

	const canEdit = ref(true);
	const isEditing = ref(false);

	async function toggleEditing(){
		if(!isEditing.value){
			isEditing.value = true;
			return;
		}

		const uuid = post.value.uuid;
		const _post = toRaw(post.value);

		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.present();

			if(!_post.title.length)
				_post.title = formatDate(_post.date, "collapsed");

			if(!uuid){
				const result = await newJournalPost({
					..._post,
					members: _post.members.map(x => x.uuid)
				});
				if(!result.success) throw new Error(`E: ${result.err || "failed"}`);
				
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();
				router.back();
				return;
			}

			const result = await updateJournalPost({
				..._post,
				members: _post.members.map(x => x.uuid)
			} as JournalPost);

			if(!result.success) throw new Error(`E: ${result.err || "failed"}`);
				
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

			isEditing.value = false;
		}catch(e){		
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

			await toast((e as Error).message);
		}
	}

	async function coverActionSheet(){
		const buttons: ActionSheetButton[] = [{
			text: i18next.t("other:cover.edit"),
			icon: pencilMD,
			handler: modifyCover
		}];

		if(post.value.cover){
			buttons.unshift(
				{
					text: i18next.t("other:cover.delete"),
					role: "destructive",
					icon: trashMD,
					handler: deleteCover
				},
				{
					text: i18next.t("other:cover.save"),
					icon: exportMD,
					handler: exportCover
				}
			);
		}

		const actionSheet = await actionSheetController.create({ buttons });
		await actionSheet.present();
	}

	async function modifyCover(){
		loadingBar.value = true;
		const image = await getResizedImage(1024);
		if(image) post.value.cover = image;
		loadingBar.value = false;
	}

	function deleteCover(){
		post.value.cover = undefined;
	}

	async function exportCover() {
		if(!post.value.cover) return;

		loadingBar.value = true;

		try{
			await saveImageFile(post.value.cover);
		}catch(e){
			await toast((e as Error).message);
		}

		loadingBar.value = false;
	}

	async function showJournalOptions(){
		const vnode = h(JournalOptions, {
			post,
			tags,
			onDidDismiss: () => removeModal(vnode)
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
		await (modal.el as any).present();
	}

	async function updateRoute() {
		if(route.name !== "JournalEdit") return;

		loading.value = true;

		tags.value = await Array.fromAsync(getTags("journal"));

		if(route.query.uuid){
			const _post = await toJournalPostComplete([await getJournalPost(route.query.uuid as string)].filter(x => !!x));
			if(_post.length) post.value = _post[0];
			else post.value = { ...emptyPost };
		} else post.value = { ...emptyPost };

		if(route.query.date){
			const maybeDate = new Date(route.query.date as string);
			if(maybeDate && !route.query.uuid)
				post.value.date = maybeDate;
		}

		if(route.query.disallowEditing)
			canEdit.value = false;
		else 
			canEdit.value = true;

		// are we editing?
		isEditing.value = !post.value.uuid;

		// set color
		updateColors();

		// get avatars
		postCommentAvatars.value = await getCommentAvatars();

		loading.value = false;
	}

	function updateColors(){
		if(accessibilityConfig.tintWithColor === "off") return;

		if(post.value.color){
			if(self?.vnode.el) addMaterialColors(rgbaToArgb(post.value.color), accessibilityConfig.tintWithColor === "on" ? rgbaToArgb(post.value.color) : undefined, self?.vnode.el as HTMLElement);
		} else 
			if(self?.vnode.el) unsetMaterialColors(self?.vnode.el as HTMLElement);
	}

	async function getCommentAvatars(){
		const commentMemberUUIDs = [...new Set(post.value.comments?.toSorted(sortDate).map(x => x.member))];
		const members = (await Promise.all(
			commentMemberUUIDs.map(async x => await getMember(x).catch(() => defaultMember(x)))
		));

		return members.map(x => ({
			image: x.image,
			clipShape: x.imageClip,
			color: x.color,
			icon: accountCircle
		}));
	}

	async function addTimestampInBody(){
		try {
			const htmlEl = bodyTextarea.value?.$el as globalThis.HTMLIonTextareaElement;
			const input = await htmlEl.getInputElement();

			const start = input.selectionStart;
			const end = input.selectionEnd;

			const before = post.value.body.slice(0, start);
			const after = post.value.body.slice(end);

			post.value.body = `${before}<t:${Math.floor(Date.now() / 1000)}:f>${after}`;
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function tagMemberInBody(member: Member){
		try {
			const htmlEl = bodyTextarea.value?.$el as globalThis.HTMLIonTextareaElement;
			const input = await htmlEl.getInputElement();

			const start = input.selectionStart;
			const end = input.selectionEnd;

			const before = post.value.body.slice(0, start);
			const after = post.value.body.slice(end);

			post.value.body = `${before}@<m:${member.uuid}>${after}`;
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function addAssetInBody(type: "image" | "file"){
		try {
			const asset = await quickAddAsset(type);
			if(!asset.success) throw new Error(`E: ${asset.err || "failed"}`);

			const htmlEl = bodyTextarea.value?.$el as globalThis.HTMLIonTextareaElement;
			const input = await htmlEl.getInputElement();

			const start = input.selectionStart;
			const end = input.selectionEnd;

			const before = post.value.body.slice(0, start);
			const after = post.value.body.slice(end);

			post.value.body = `${before}${type === "image" ? "!" : ""}[](@${asset.detail.friendlyName})${after}`;
		}catch(e){
			await toast((e as Error).message);
		}
	}

	watch(route, updateRoute);
	watch(() => post.value.color, updateColors);
	onBeforeMount(updateRoute);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					default-href="/"
				/>
				<IonTitle>
					{{ !isEditing ? $t("journal:edit.header") : !post.uuid ? $t("journal:edit.headerAdd") :
						$t("journal:edit.headerEdit") }}
				</IonTitle>
				<IonProgressBar v-if="loadingBar" type="indeterminate" />
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>

			<div v-if="post.cover || isEditing" class="cover">
				<img v-if="post.cover" :src="getObjectURL(post.cover)" />
				<div v-else class="no-img">
					<IonIcon :icon="imageMD" />
				</div>
				<IonButton
					v-if="isEditing"
					shape="round"
					size="small"
					@click="coverActionSheet"
				>
					<IonIcon slot="icon-only" :icon="pencilMD" />
				</IonButton>
			</div>

			<IonList v-if="!isEditing">
				<div class="member-chips">
					<MemberChip
						v-for="member in post.members.toSorted(sortName)"
						:key="member.uuid"
						:member
						clickable
					/>
				</div>

				<IonItem
					v-if="post.uuid"
					class="surface comments"
					button
					detail
					@click="postComments?.$el.present()"
				>
					<AvatarStack
						v-if="postCommentAvatars?.length"
						slot="start"
						:avatars="postCommentAvatars"
						normal-stack
					/>
					{{ $t("other:comments.commentCount", { count: post.comments?.length || 0 }) }}
				</IonItem>

				<div class="post-body">
					<p v-if="post.date" class="date">{{ formatDate(post.date, "expanded") }}</p>
					<h1>{{ post.title }}</h1>
					<h2 v-if="post.subtitle?.length">{{ post.subtitle }}</h2>
					<div v-if="tags?.length" class="journal-tags">
						<TagChip
							v-for="tag in post.tags.map(x => tags.find(y => x === y.uuid)).filter((x): x is Tag => !!x && !x.isArchived).sort(sortName)"
							:key="tag.uuid"
							:tag
							:clickable="true"
						/>
					</div>
					<Markdown :markdown="post.body" />
				</div>

			</IonList>

			<template v-else>
				<IonList>
					<IonItem
						button
						detail
						@click="memberSelectModal?.$el.present()"
					>
						<IonLabel>
							<h2>{{ $t("journal:edit.author") }}</h2>
							<p>
								<MemberChip v-for="member in post.members.toSorted(sortName)" :key="member.uuid" :member />
							</p>
						</IonLabel>
					</IonItem>

				</IonList>
				<IonList class="surface">

					<IonItem class="title">
						<IonInput v-model="post.title" :placeholder="$t('journal:edit.title')" />
					</IonItem>

					<IonItem class="subtitle">
						<IonInput v-model="post.subtitle" :placeholder="$t('journal:edit.subtitle')" />
					</IonItem>

					<IonItem class="edit-body">
						<IonTextarea
							ref="bodyTextarea"
							v-model="post.body"
							auto-grow
							:placeholder="$t('journal:edit.body')"
						/>
					</IonItem>

				</IonList>
			</template>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="canEdit" @click="toggleEditing">
					<IonIcon :icon="isEditing ? saveMD : pencilMD" />
				</IonFabButton>
			</IonFab>

			<MemberSelect
				ref="memberSelectModal"
				v-model="post.members"
				:always-emit="true"
			/>

			<MemberSelect
				ref="memberTagModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:always-emit="true"
				:model-value="[]"
				@update:model-value="(e) => { if(e[0]) void tagMemberInBody(e[0]) }"
			/>

			<Comments
				v-if="post.uuid"
				ref="postComments"
				:model-value="post.comments"
				@update:model-value="async (e) => {
					post.comments = e;
					await updateJournalPost({
						...post as JournalPostComplete,
						members: post.members.map(x => x.uuid)
					}); 
				}"
			/>

			<Loading ref="loadingModal" />

		</IonContent>

		<IonFooter v-if="isEditing">
			<IonToolbar>
				<IonButtons>
					<IonButton @click="addTimestampInBody">
						<IonIcon slot="icon-only" :icon="clockAddMD" />
					</IonButton>
					<IonButton @click="memberTagModal?.$el.present()">
						<IonIcon slot="icon-only" :icon="personAddMD" />
					</IonButton>
					<IonButton fill="clear" @click="addAssetInBody('file')">
						<IonIcon slot="icon-only" :icon="fileMD" />
					</IonButton>
					<IonButton fill="clear" @click="addAssetInBody('image')">
						<IonIcon slot="icon-only" :icon="imageMD" />
					</IonButton>
					<IonButton @click="showJournalOptions">
						<IonIcon slot="icon-only" :icon="settingsMD" />
					</IonButton>
				</IonButtons>
			</IonToolbar>
		</IonFooter>
	</IonPage>
</template>

<style scoped>
	div.cover {
		height: 25vh;
		width: calc(100% - 32px - var(--ion-safe-area-left, 0px) - var(--ion-safe-area-right, 0px));
		border-radius: 16px;
		margin: 16px calc(16px + var(--ion-safe-area-right, 0px)) 16px calc(16px + var(--ion-safe-area-left, 0px));
		position: relative;
		display: block;
		overflow: hidden;
		background-color: var(--ion-background-color-step-200);
	}

	div.cover > :is(img, div.no-img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	div.cover > div.no-img {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	div.cover > div.no-img > ion-icon {
		width: 48px;
		height: 48px;
	}

	div.cover > ion-button {
		position: absolute;
		z-index: 2;
		bottom: 8px;
		right: 8px;
	}

	div.cover > ion-button.delete {
		position: absolute;
		z-index: 2;
		bottom: 8px;
		left: 8px;
		right: unset;
	}

	div.member-chips {
		margin-inline: 16px;
	}

	div.journal-tags, div.member-chips {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
	}

	div.post-body > div.journal-tags {
		margin-top: .5rem;
	}

	div.post-body {
		margin: 0 calc(1rem + var(--ion-safe-area-left, 0px)) 0 calc(1rem + var(--ion-safe-area-right, 0px));
	}

	div.post-body > p.date {
		margin-top: .25rem;
		opacity: 0.5;
	}

	div.post-body > h1 {
		font-size: 1.95rem;
		margin-top: 0;
		line-height: 2rem;
	}

	div.post-body > h2 {
		font-size: 1.5rem;
		margin: 0;
		line-height: 1.75rem;
	}

	ion-item.title {
		font-size: 1.95rem;
		--inner-padding-top: 0;
		--inner-padding-bottom: 0;
	}

	ion-item.subtitle {
		font-size: 1.625rem;
		--inner-padding-top: 0;
		--inner-padding-bottom: 0;
	}

	ion-item.edit-body ion-textarea {
		--padding-top: 0;
		--padding-bottom: 0;
	}

	ion-item.comments {
		--min-height: 48px;

		.avatar-stack * {
			width: 36px;
			height: 36px;
			--gap: 24px;
		}
	}

	ion-buttons {
		display: flex;
		justify-content: space-around;
	}
</style>