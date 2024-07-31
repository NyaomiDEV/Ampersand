<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonAvatar,
		IonButton,
		IonIcon,
		IonList,
		IonInput,
		IonToggle,
		IonTextarea,
		IonFab,
		IonFabButton,
		IonLabel,
		IonItem,
		modalController,
		IonModal,
		IonButtons
	} from "@ionic/vue";
	import Color from "../components/Color.vue";
	import TagChip from "../components/tag/TagChip.vue";

	import TagListSelect from "./TagListSelect.vue";

	import {
		pencilOutline as pencilIOS,
		saveOutline as saveIOS,
		personOutline as personIOS,
		chevronBack as backIOS,
		newspaperOutline as newspaperIOS,
		journalOutline as journalIOS,
		trashBinOutline as trashIOS
	} from "ionicons/icons";

	import pencilMD from "@material-design-icons/svg/outlined/edit.svg";
	import saveMD from "@material-design-icons/svg/outlined/save.svg";
	import personMD from "@material-design-icons/svg/outlined/person.svg";
	import backMD from "@material-design-icons/svg/outlined/arrow_back.svg";
	import newspaperMD from "@material-design-icons/svg/outlined/newspaper.svg";
	import journalMD from "@material-design-icons/svg/outlined/book.svg";
	import trashMD from "@material-design-icons/svg/outlined/delete.svg";

	import { Member, getTable, newMember } from '../lib/db/entities/members';
	import { Tag, tags } from "../lib/db/entities/tags";
	import { getBlobURL } from '../lib/util/blob';
	import { getFiles } from "../lib/util/misc";
	import { resizeImage } from "../lib/util/image";
	import { Ref, ShallowReactive, WatchStopHandle, inject, provide, ref, shallowReactive, toRaw, watch } from "vue";
	import { getMarkdownFor } from "../lib/markdown";
	import { addMaterialColors, unsetMaterialColors } from "../lib/theme";
	import { PartialBy } from "../lib/db/types";

	const isIOS = inject<boolean>("isIOS")!;
	const member = inject<Ref<PartialBy<Member, "uuid"> | undefined>>("member")!;

	const tagSelectionModal = ref();
	const selectedTags: ShallowReactive<Tag[]> = shallowReactive([]);
	provide("selectedTags", selectedTags);

	const isEditing = ref(false);
	const self = ref();

	const watchStopHandles: WatchStopHandle[] = [];

	async function toggleEditing(){
		if(!member.value) return;

		if(!isEditing.value){
			isEditing.value = true;
			return;
		}

		const uuid = member.value.uuid;
		const _member = toRaw(member.value);

		// tags will be proxy
		_member.tags = toRaw(_member.tags);

		if(!uuid){
			await newMember(_member);
			await modalController.dismiss();

			return;
		}

		await getTable().update(uuid, _member);
			
		isEditing.value = false;
	}

	async function modifyPicture(){
		if(!member.value) return;

		const files = await getFiles();
		if(files.length){
			member.value.image = await resizeImage(files[0]);
		}
	}

	async function deleteMember() {
		if(!member.value || !member.value.uuid) return;

		await getTable().delete(member.value.uuid);
		
		try{
			await modalController.dismiss();
		}catch(_){}
	}

	function present() {
		watchStopHandles.forEach(x => x());
		watchStopHandles.length = 0;

		if(!member.value) return;

		watchStopHandles.push(
			watch(selectedTags, () => {
				member.value!.tags = selectedTags.map(x => x.uuid)
			}, {immediate: false})
		);

		// push tags inside
		selectedTags.length = 0;
		selectedTags.push(...member.value.tags.map(x => tags.value.find(y => y.uuid === x)!))

		// are we editing?
		isEditing.value = !member.value.uuid;

		// set color
		if(member.value.color && member.value.color !== "#000000"){
			addMaterialColors(member.value.color, self.value.$el);
		} else {
			unsetMaterialColors(self.value.$el);
		}
	}
</script>

<template>
	<IonModal class="member-edit-modal" ref="self" @willPresent="present">
		<IonHeader>
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton shape="round" fill="clear" @click="self.$el.dismiss()">
						<IonIcon slot="icon-only" :md="backMD" :ios="backIOS"></IonIcon>
					</IonButton>
				</IonButtons>
				<IonTitle>{{ !member!.uuid ? $t("members:edit.headerAdd") : $t("members:edit.headerEdit") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<div class="avatar-container">
				<IonAvatar>
					<img aria-hidden="true" :src="member!.image ? getBlobURL(member!.image) : (isIOS ? personIOS : personMD)" />
				</IonAvatar>
				<IonButton shape="round" @click="modifyPicture" v-if="isEditing">
					<IonIcon slot="icon-only" :ios="pencilIOS" :md="pencilMD" />
				</IonButton>
			</div>

			<div class="member-info" v-if="!isEditing">
				<h1>{{ member!.name }}</h1>
				<p>{{ member!.pronouns }}</p>
				<p>{{ member!.role }}</p>
				<p v-if="member!.isCustomFront">{{ $t("members:edit.customFront") }}</p>
				<p v-if="member!.isArchived">{{ $t("members:edit.archived") }}</p>
			</div>

			<div class="member-tags" v-if="!isEditing">
				<TagChip v-if="tags?.length" v-for="tag in member!.tags" :tag="tags.find(x => x.uuid === tag)!" />
			</div>

			<div class="member-description" v-if="!isEditing">
				<IonLabel>{{ $t("members:edit.description") }}</IonLabel>
				<div class="markdown-content" v-html="getMarkdownFor(member!.description || $t('members:edit.noDescription'))"></div>
			</div>

			<IonList class="member-actions" v-if="!isEditing">
				<IonItem button detail>
					<IonIcon :ios="newspaperIOS" :md="newspaperMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("members:edit.showBoardEntries") }}</IonLabel>
				</IonItem>
				<IonItem button detail>
					<IonIcon :ios="journalIOS" :md="journalMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("members:edit.showJournalEntries") }}</IonLabel>
				</IonItem>
			</IonList>

			<IonList class="member-edit" v-if="isEditing" inset>
					<IonItem lines="none">
						<IonInput mode="md" fill="outline" :label="$t('members:edit.name')" labelPlacement="floating" v-model="member!.name" />
					</IonItem>
					<IonItem lines="none">
						<IonInput mode="md" fill="outline" :label="$t('members:edit.pronouns')" labelPlacement="floating" v-model="member!.pronouns" />
					</IonItem>
					<IonItem lines="none">
						<IonInput mode="md" fill="outline" :label="$t('members:edit.role')" labelPlacement="floating" v-model="member!.role" />
					</IonItem>
					<IonItem lines="none">
						<IonTextarea mode="md" fill="outline" auto-grow :label="$t('members:edit.description')" labelPlacement="floating" v-model="member!.description" />
					</IonItem>
					<IonItem button lines="none">
						<Color v-model="member!.color" @update:model-value="present">
							<IonLabel>
								{{ $t("members:edit.color") }}
							</IonLabel>
						</Color>
					</IonItem>
					<IonItem button lines="none">
						<IonToggle v-model="member!.isCustomFront">
							<IonLabel>
								{{ $t("members:edit.isCustomFront") }}
							</IonLabel>
						</IonToggle>
					</IonItem>
					<IonItem button lines="none">
						<IonToggle v-model="member!.isArchived">
							<IonLabel>
								{{ $t("members:edit.isArchived") }}
							</IonLabel>
						</IonToggle>
					</IonItem>

					<IonItem button lines="none" @click="tagSelectionModal.$el.present()">
						<IonLabel>
							{{ $t("members:edit.tags") }}
							<div class="member-tags">
								<TagChip v-if="tags?.length" v-for="tag in member!.tags" :tag="tags.find(x => x.uuid === tag)!" />
							</div>
						</IonLabel>
					</IonItem>
					<IonItem button lines="none" v-if="member!.uuid" @click="deleteMember">
						<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" />
						<IonLabel>
							<h3>{{ $t("members:edit.delete.title") }}</h3>
							<p>{{ $t("members:edit.delete.desc") }}</p>
						</IonLabel>
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="toggleEditing" v-if="member!.name.length > 0">
					<IonIcon :ios="isEditing ? saveIOS : pencilIOS" :md="isEditing ? saveMD : pencilMD" />
				</IonFabButton>
			</IonFab>

			<TagListSelect ref="tagSelectionModal" />
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.member-edit-modal {
		--width: 100dvw;
		--height: 100dvh;
	}

	ion-content {
		--padding-bottom: 80px;
	}

	div.avatar-container {
		position: relative;
		width: fit-content;
		height: fit-content;
		display: block;
		margin-left: auto;
		margin-right: auto;
		margin-top: 24px;
		margin-bottom: 16px;
	}

	div.member-tags {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		padding: 0 16px;
	}

	.member-edit div.member-tags {
		padding: 8px 0 0 0;
		justify-content: start;
	}

	ion-avatar {
		width: 192px;
		height: 192px;
	}

	div.avatar-container ion-button {
		position: absolute;
		bottom: 8px;
		right: 8px;
	}

	div.member-info {
		display: block;
		margin: auto;
		text-align: center;
	}

	div.member-info * {
		margin: 0;
	}

	div.member-description {
		padding: 16px;
	}

	div.member-description ion-label {
		color: var(--ion-color-step-600, var(--ion-text-color-step-400, #666666));
	}

	div.markdown-content :deep(:is(h1, h2, h3, h4, h5, h6, p)) {
		margin-top: 0;
		margin-bottom: 0.25rem;
	}

	div.markdown-content :deep(h1) {
		font-size: 1.5rem;
	}

	div.markdown-content :deep(h2) {
		font-size: 1.25rem;
	}

	div.markdown-content :deep(h3) {
		font-size: 1rem;
	}

	ion-input, ion-textarea {
		margin-top: 16px;
	}

	.member-edit ion-item {
		margin-bottom: 16px;
	}
</style>