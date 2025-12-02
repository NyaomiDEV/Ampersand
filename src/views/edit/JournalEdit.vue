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
	} from "@ionic/vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg";
	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import imageMD from "@material-symbols/svg-600/outlined/image.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";
	import settingsMD from "@material-symbols/svg-600/outlined/settings.svg";
	import personAddMD from "@material-symbols/svg-600/outlined/person_add.svg";
	import clockAddMD from "@material-symbols/svg-600/outlined/more_time.svg";

	import { JournalPost, Tag } from "../../lib/db/entities";
	import { newJournalPost, updateJournalPost, getJournalPost } from "../../lib/db/tables/journalPosts";
	import { getFiles, formatDate } from "../../lib/util/misc";
	import { resizeImage } from "../../lib/util/image";
	import { h, onBeforeMount, ref, shallowRef, toRaw, useTemplateRef, watch } from "vue";
	import Markdown from "../../components/Markdown.vue";
	import MemberAvatar from "../../components/member/MemberAvatar.vue";
	import TagChip from "../../components/tag/TagChip.vue";
	import MemberSelect from "../../modals/MemberSelect.vue";
	import JournalOptions from "../../modals/JournalOptions.vue";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { getObjectURL } from "../../lib/util/blob";
	import { deleteFile, newFile, updateFile } from "../../lib/db/tables/files";
	import { deleteJournalPostTag, getJournalPostTagsForPost, newJournalPostTag } from "../../lib/db/tables/journalPostTags";
	import { addModal, removeModal } from "../../lib/modals";

	const router = useIonRouter();
	const route = useRoute();

	const loading = ref(false);
	const memberSelectModal = useTemplateRef("memberSelectModal");
	const memberTagModal = useTemplateRef("memberTagModal");

	const tags = shallowRef<Tag[]>([]);

	const emptyPost: PartialBy<JournalPost, "id" | "member"> = {
		title: "",
		date: new Date(),
		body: "",
		isPrivate: false,
		isPinned: false
	};

	const post = ref({ ...emptyPost });
	const coverUri = ref();

	const canEdit = ref(true);
	const isEditing = ref(false);

	async function toggleEditing(){
		if(!isEditing.value){
			isEditing.value = true;
			return;
		}

		let id = post.value.id;
		const _post = toRaw(post.value);

		if(!_post.title.length)
			_post.title = formatDate(_post.date, "collapsed");

		let isNew = false;
		if(!id){
			isNew = true;
			id = (await newJournalPost({ ..._post }))?.id;
		} else 
			await updateJournalPost(id, {	..._post });

		if(id){
			let _tags = toRaw(tags.value);
			const allJournalTags = await Array.fromAsync(getJournalPostTagsForPost({ ..._post, id } as JournalPost));
			for(const journalTag of allJournalTags){
				const tag = _tags.find(x => x.id === journalTag.tag.id);
				if(!tag)
					await deleteJournalPostTag(journalTag.id);
				else _tags = _tags.filter(x => x !== tag);
			}
			for(const remainingTag of _tags){
				await newJournalPostTag({
					tag: remainingTag,
					post: { ..._post, id } as JournalPost
				});
			}
		}

		if(isNew){
			router.back();
			return;
		}

		isEditing.value = false;
	}

	async function modifyCover(){
		const files = await getFiles();
		if(files.length){
			let _file: File;
			if(files[0].type === "image/gif")
				_file = files[0];
			else
				_file = await resizeImage(files[0]);
			if(post.value.cover)
				await updateFile(post.value.cover.id, undefined, _file.stream());
			else 
				post.value.cover = await newFile(_file.name, _file.stream());
		}

		await updateCoverUri();
	}

	async function deleteCover(){
		if(post.value.cover){
			await deleteFile(post.value.cover.id);
			post.value.cover = undefined;
		}
	}

	async function updateCoverUri(){
		if(post.value.cover)
			coverUri.value = await getObjectURL(post.value.cover);
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

		if(route.query.uuid){
			const _post = await getJournalPost(route.query.uuid as string);
			if(_post) post.value = _post;
			else post.value = { ...emptyPost };
		} else post.value = { ...emptyPost };

		await updateCoverUri();
		
		if(post.value.id){
			tags.value = (await Array.fromAsync(getJournalPostTagsForPost(post.value as JournalPost)))
				.map(x => x.tag)
				.sort((a, b) => a.name.localeCompare(b.name));
		}

		if(route.query.disallowEditing)
			canEdit.value = false;
		else 
			canEdit.value = true;

		// are we editing?
		isEditing.value = !post.value.id;

		loading.value = false;
	}

	watch(route, updateRoute);
	onBeforeMount(updateRoute);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					:icon="backMD"
					default-href="/journal/"
				/>
				<IonTitle>
					{{ !isEditing ? $t("journal:edit.header") : !post.id ? $t("journal:edit.headerAdd") :
						$t("journal:edit.headerEdit") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>

			<div v-if="coverUri || isEditing" class="cover">
				<img v-if="coverUri" :src="coverUri" />
				<div v-else class="no-img">
					<IonIcon :icon="imageMD" />
				</div>
				<IonButton v-if="isEditing" shape="round" @click="modifyCover">
					<IonIcon slot="icon-only" :icon="pencilMD" />
				</IonButton>
				<IonButton
					v-if="isEditing && post.cover"
					class="delete"
					shape="round"
					color="danger"
					@click="deleteCover"
				>
					<IonIcon slot="icon-only" :icon="trashMD" />
				</IonButton>
			</div>

			<IonList v-if="!isEditing" inset>

				<IonItem>
					<MemberAvatar v-if="post.member" slot="start" :member="post.member" />
					<IonLabel>
						<h2 v-if="post.member">{{ post.member.name }}</h2>
						<p v-if="post.date">{{ formatDate(post.date, "expanded") }}</p>
					</IonLabel>
				</IonItem>

				<div class="post-body">
					<h1>{{ post.title }}</h1>
					<h2 v-if="post.subtitle?.length">{{ post.subtitle }}</h2>
					<div v-if="tags?.length" class="journal-tags">
						<TagChip
							v-for="tag in tags"
							:key="tag.id"
							:tag
						/>
					</div>
					<Markdown :markdown="post.body" />
				</div>

			</IonList>

			<IonList v-else inset>

				<IonItem button :detail="!post.member" @click="memberSelectModal?.$el.present()">
					<template v-if="post.member">
						<MemberAvatar slot="start" :member="post.member" />
						<IonLabel>
							<h2>{{ post.member.name }}</h2>
							<p>{{ $t("journal:edit.author") }}</p>
						</IonLabel>
						<IonButton
							slot="end"
							shape="round"
							fill="outline"
							size="default"
							@click="(e) => { e.stopPropagation(); post.member = undefined; }"
						>
							<IonIcon
								slot="icon-only"
								:icon="trashMD"
								color="danger"
							/>
						</IonButton>
					</template>
					<template v-else>
						<IonLabel>
							<h2>{{ $t("journal:edit.author") }}</h2>
						</IonLabel>
					</template>
				</IonItem>

				<IonItem class="title">
					<IonInput v-model="post.title" :placeholder="$t('journal:edit.title')" />
				</IonItem>

				<IonItem class="subtitle">
					<IonInput v-model="post.subtitle" :placeholder="$t('journal:edit.subtitle')" />
				</IonItem>

				<IonItem class="edit-body">
					<IonTextarea v-model="post.body" auto-grow :placeholder="$t('journal:edit.body')" />
				</IonItem>

			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="canEdit" @click="toggleEditing">
					<IonIcon :icon="isEditing ? saveMD : pencilMD" />
				</IonFabButton>
			</IonFab>

			<MemberSelect
				ref="memberSelectModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:always-emit="true"
				:model-value="post.member ? [post.member] : []"
				@update:model-value="(e) => { if (e[0]) post.member = e[0]; }"
			/>

			<MemberSelect
				ref="memberTagModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:always-emit="true"
				:model-value="[]"
				@update:model-value="(e) => { if(e[0]) post.body = `${post.body || ''}@<m:${e[0].id}>` }"
			/>

		</IonContent>

		<IonFooter v-if="isEditing">
			<IonToolbar>
				<IonButtons>
					<IonButton @click="post.body = `${post.body}<t:${Math.floor(Date.now() / 1000)}:f>`">
						<IonIcon slot="icon-only" :icon="clockAddMD" />
					</IonButton>
					<IonButton @click="memberTagModal?.$el.present()">
						<IonIcon slot="icon-only" :icon="personAddMD" />
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

	div.journal-tags {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
	}

	div.post-body > div.journal-tags {
		margin-top: .5rem;
	}

	div.post-body {
		margin: 1rem calc(1rem + var(--ion-safe-area-left, 0px)) 0 calc(1rem + var(--ion-safe-area-right, 0px));
	}

	div.post-body > h1 {
		font-size: 1.95rem;
		margin-top: 0;
	}

	div.post-body > h2 {
		font-size: 1.5rem;
		margin: 0;
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

	ion-buttons {
		display: flex;
		justify-content: space-around;
	}
</style>