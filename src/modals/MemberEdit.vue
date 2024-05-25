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
		IonTextarea,
		IonFab,
		IonFabButton,
		IonLabel,
		IonItem,
		modalController,
		IonModal
	} from "@ionic/vue";

	import {
		pencilOutline as pencilIOS,
		saveOutline as saveIOS,
		personOutline as personIOS
	} from "ionicons/icons";

	import pencilMD from "@material-design-icons/svg/outlined/edit.svg";
	import saveMD from "@material-design-icons/svg/outlined/save.svg";
	import personMD from "@material-design-icons/svg/outlined/person.svg";

	import { Member, getTable, newMember } from '../lib/db/entities/members';
	import { getBlobURL } from '../lib/util/blob';
	import { getFiles } from "../lib/util/misc";
	import { resizeImage } from "../lib/util/image";
	import { Ref, inject, onMounted, ref } from "vue";
	import { getMarkdownFor } from "../lib/markdown";

	type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
	const isOpen = inject<Ref<boolean>>("isOpen");
	const props = defineProps<{
		member?: PartialBy<Member, "uuid">,
		add: boolean,
		edit?: boolean
	}>();
	const isIOS = inject<boolean>("isIOS");
	
	const member = ref({
		name: props.member?.name || "",
		isArchived: props.member?.isArchived || false,
		isCustomFront: props.member?.isCustomFront || false,
		...props.member || {}
	} as PartialBy<Member, "uuid">);

	const isEditing = ref(props.add || props.edit);

	async function toggleEditing(){
		if(isEditing.value){
			const { uuid, ...memberWithoutUUID } = member.value;
			if(!props.add){
				await getTable().update(member.value.uuid, memberWithoutUUID);

				// update member in props, since it's reactive
				for(const prop in member.value)
					props.member![prop] = member.value[prop];
				
				isEditing.value = false;
			} else {
				await newMember(memberWithoutUUID);
				modalController.dismiss(null, "added");
			}
		} else {
			isEditing.value = true;
		}
	}

	async function modifyPicture(){
		const files = await getFiles();
		if(files.length){
			member.value.image = await resizeImage(files[0]);
		}
	}
</script>

<template>
	<IonModal :isOpen @didDismiss="isOpen = false">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ props.add ? $t("members:edit.headerAdd") : $t("members:edit.headerEdit") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<div class="avatar-container">
				<IonAvatar>
					<img aria-hidden="true" :src="member.image ? getBlobURL(member.image) : (isIOS ? personIOS : personMD)" />
				</IonAvatar>
				<IonButton shape="round" @click="modifyPicture" v-if="isEditing">
					<IonIcon slot="icon-only" :ios="pencilIOS" :md="pencilMD" />
				</IonButton>
			</div>

			<div class="member-info" v-if="!isEditing">
				<h1>{{ member.name }}</h1>
				<p>{{ member.pronouns }}</p>
				<p>{{ member.role }}</p>
			</div>

			<div class="member-description" v-if="!isEditing">
				<IonLabel>{{ $t("members:edit.description") }}</IonLabel>
				<div class="markdown-content" v-html="getMarkdownFor(member.description || $t('members:edit.noDescription'))"></div>
			</div>

			<IonList v-if="isEditing" :inset="true">
					<IonItem lines="none">
						<IonInput mode="md" fill="outline" :label="$t('members:edit.name')" labelPlacement="floating" v-model="member.name" />
					</IonItem>
					<IonItem lines="none">
						<IonInput mode="md" fill="outline" :label="$t('members:edit.pronouns')" labelPlacement="floating" v-model="member.pronouns" />
					</IonItem>
					<IonItem lines="none">
						<IonInput mode="md" fill="outline" :label="$t('members:edit.role')" labelPlacement="floating" v-model="member.role" />
					</IonItem>
					<IonItem lines="none">
						<IonTextarea mode="md" fill="outline" auto-grow :label="$t('members:edit.description')" labelPlacement="floating" v-model="member.description" />
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="toggleEditing" v-if="member.name.length > 0">
					<IonIcon :ios="isEditing ? saveIOS : pencilIOS" :md="isEditing ? saveMD : pencilMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonModal>
</template>

<style scoped>
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
		margin-bottom: 16px;
	}
</style>