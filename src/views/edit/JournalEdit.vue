<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonFab,
		IonButton,
		IonLabel,
		IonTextarea,
		IonList,
		IonToggle,
		IonFabButton,
		IonBackButton,
		useIonRouter,
		IonPage,
		alertController,
		IonInput,
		IonItem
	} from "@ionic/vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg";
	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import imageMD from "@material-symbols/svg-600/outlined/image.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { JournalPostComplete, Tag } from "../../lib/db/entities";
	import { newJournalPost, updateJournalPost, deleteJournalPost, getJournalPost, toJournalPostComplete } from '../../lib/db/tables/journalPosts';
	import { getFiles, formatDate } from "../../lib/util/misc";
	import { resizeImage } from "../../lib/util/image";
	import { inject, onBeforeMount, ref, shallowRef, toRaw, useTemplateRef, watch } from "vue";
	import Markdown from "../../components/Markdown.vue";
	import MemberAvatar from "../../components/member/MemberAvatar.vue";
	import TagChip from "../../components/tag/TagChip.vue";
	import MemberSelect from "../../modals/MemberSelect.vue";
	import TagListSelect from "../../modals/TagListSelect.vue";
	import DatePopupPicker from "../../components/DatePopupPicker.vue";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import { useTranslation } from "i18next-vue";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { getObjectURL } from "../../lib/util/blob";
	import { getTags } from "../../lib/db/tables/tags";

	const i18next = useTranslation();

	const isIOS = inject<boolean>("isIOS")!;

	const router = useIonRouter();
	const route = useRoute();

	const loading = ref(false);
	const memberSelectModal = useTemplateRef("memberSelectModal");

	const tags = shallowRef<Tag[]>([]);
	const tagSelectionModal = useTemplateRef("tagSelectionModal");

	const emptyPost: PartialBy<JournalPostComplete, "uuid" | "member"> = {
		title: "",
		date: new Date(),
		body: "",
		tags: [],
		isPrivate: false,
		isPinned: false
	};

	const post = ref({...emptyPost});

	const canEdit = ref(true);
	const isEditing = ref(false);

	async function toggleEditing(){
		if(!isEditing.value){
			isEditing.value = true;
			return;
		}

		const uuid = post.value.uuid;
		const _post = toRaw(post.value);

		if (!_post.member) return;

		if(!uuid){
			await newJournalPost({
				..._post,
				member: _post.member.uuid,
				date: new Date()
			});
			router.back();

			return;
		}

		await updateJournalPost(uuid, {
			..._post,
			member: _post.member.uuid
		});

		isEditing.value = false;
	}

	async function modifyCover(){
		const files = await getFiles();
		if(files.length){
			if(files[0].type == 'image/gif'){
				post.value.cover = files[0];
				return;
			}
			post.value.cover = await resizeImage(files[0]);
		}
	}

	function promptDeletion(): Promise<boolean> {
		return new Promise(async (resolve) => {
			const alert = await alertController.create({
				header: i18next.t("journal:edit.delete.title"),
				subHeader: i18next.t("journal:edit.delete.confirm"),
				buttons: [
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel",
						handler: () => resolve(false)
					},
					{
						text: i18next.t("other:alerts.ok"),
						role: "confirm",
						handler: () => resolve(true)
					}
				]
			});

			await alert.present();
		});
	}

	async function removePost() {
		if(await promptDeletion()){
			await deleteJournalPost(post.value.uuid!);
			router.back();
		}
	}

	async function updateRoute() {
		if(route.name !== "JournalEdit") return;

		loading.value = true;

		const _tags: Tag[] = [];
		for await (const tag of getTags()){
			if(tag.type === "journal")
				_tags.push(tag);
		}
		tags.value = _tags;

		if(route.query.uuid){
			const _post = await getJournalPost(route.query.uuid as string);
			if(_post) post.value = await toJournalPostComplete(_post);
			else post.value = { ...emptyPost };
		} else post.value = { ...emptyPost };

		if(route.query.disallowEditing){
			canEdit.value = false;
		} else {
			canEdit.value = true;
		}

		// are we editing?
		isEditing.value = !post.value.uuid;

		loading.value = false;
	}

	watch(route, updateRoute);
	onBeforeMount(updateRoute);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" :text="isIOS ? $t('other:back') : undefined"
					:icon="!isIOS ? backMD : undefined" defaultHref="/journal/" />
				<IonTitle>{{ !isEditing ? $t("journal:edit.header") : !post.uuid ? $t("journal:edit.headerAdd") :
					$t("journal:edit.headerEdit") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>

			<div class="cover" v-if="post.cover || isEditing">
				<img :src="getObjectURL(post.cover)" v-if="post.cover">
				<div class="no-img" v-else>
					<IonIcon :icon="imageMD" />
				</div>
				<IonButton shape="round" @click="modifyCover" v-if="isEditing">
					<IonIcon slot="icon-only" :icon="pencilMD" />
				</IonButton>
				<IonButton class="delete" shape="round" color="danger" @click="post.cover = undefined" v-if="isEditing && post.cover">
					<IonIcon slot="icon-only" :icon="trashMD" />
				</IonButton>
			</div>

			<IonList inset v-if="!isEditing">

				<IonItem v-if="post.member">
					<MemberAvatar slot="start" :member="post.member" />
					<IonLabel>
						<h2>{{ post.member.name }}</h2>
						<p v-if="post.date">{{ formatDate(post.date, "expanded") }}</p>
					</IonLabel>
				</IonItem>

				<div class="post-body">
					<h1>{{ post.title }}</h1>
					<h2 v-if="post.subtitle?.length">{{ post.subtitle }}</h2>
					<div class="journal-tags" v-if="!isEditing">
						<TagChip v-if="tags?.length" v-for="tag in post.tags" :key="tag"
							:tag="tags.find(x => x.uuid === tag)!" />
					</div>
					<Markdown :markdown="post.body" />
				</div>

			</IonList>

			<IonList inset v-else>

				<IonItem button @click="memberSelectModal?.$el.present()">
					<template v-if="post.member">
						<MemberAvatar slot="start" :member="post.member" />
						<IonLabel>
							<h2>{{ post.member.name }}</h2>
							<p>{{ $t("journal:edit.author") }}</p>
						</IonLabel>
					</template>
					<template v-else>
						<IonLabel>
							<h2>{{ $t("journal:edit.author") }}</h2>
						</IonLabel>
					</template>
				</IonItem>

				<IonItem button @click="($refs.datePicker as any)?.$el.present()">
						<IonLabel>
							<h2>{{ $t("journal:edit.date") }}</h2>
							<p>{{ formatDate(post.date, "expanded") }}</p>
						</IonLabel>
						<DatePopupPicker
							v-model="post.date"
							showDefaultButtons
							ref="datePicker"
							:title="$t('journal:edit.date')"
						/>
					</IonItem>

				<IonItem class="title">
					<IonInput :placeholder="$t('journal:edit.title')" v-model="post.title" />
				</IonItem>

				<IonItem class="subtitle">
					<IonInput :placeholder="$t('journal:edit.subtitle')" v-model="post.subtitle" />
				</IonItem>

				<IonItem button @click="tagSelectionModal?.$el.present()">
					<IonLabel>
						{{ $t("journal:edit.tags") }}
						<div class="journal-tags">
							<TagChip v-if="tags?.length" v-for="tag in post.tags" :key="tag"
								:tag="tags.find(x => x.uuid === tag)!" />
						</div>
					</IonLabel>
				</IonItem>

				<IonItem>
					<IonTextarea auto-grow :placeholder="$t('journal:edit.body')" v-model="post.body" />
				</IonItem>

				<IonItem button :detail="false">
					<IonToggle v-model="post.isPinned">
						<IonLabel>
							{{ $t("journal:edit.isPinned") }}
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem button :detail="false">
					<IonToggle v-model="post.isPrivate">
						<IonLabel>
							{{ $t("journal:edit.isPrivate") }}
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonTextarea :fill="!isIOS ? 'outline' : undefined" auto-grow :label="$t('journal:edit.contentWarning')"
						labelPlacement="floating" v-model="post.contentWarning" />
				</IonItem>

				<IonItem button :detail="false" v-if="post.uuid" @click="removePost">
					<IonIcon :icon="trashMD" slot="start" aria-hidden="true" color="danger" />
					<IonLabel color="danger">
						<h3>{{ $t("journal:edit.delete.title") }}</h3>
						<p>{{ $t("other:genericDeleteDesc") }}</p>
					</IonLabel>
				</IonItem>

			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="toggleEditing" v-if="post.title.length > 0 && canEdit">
					<IonIcon :icon="isEditing ? saveMD : pencilMD" />
				</IonFabButton>
			</IonFab>

			<TagListSelect ref="tagSelectionModal" type="journal"
				:modelValue="post.tags.map(uuid => tags.find(x => x.uuid === uuid)!)"
				@update:modelValue="tags => { post.tags = tags.map(x => x.uuid); }" />

			<MemberSelect :onlyOne="true" :discardOnSelect="true" :hideCheckboxes="true"
				:modelValue="post.member ? [post.member] : []"
				@update:modelValue="(e) => { if (e[0]) post.member = e[0]; }" ref="memberSelectModal" />

		</IonContent>
	</IonPage>
</template>

<style scoped>
	div.cover {
		height: 50vh;
		width: calc(100% - 32px);
		border-radius: 16px;
		margin: 16px;
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
		margin: 1rem 1rem 0 1rem;
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
</style>