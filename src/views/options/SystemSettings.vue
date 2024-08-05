<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonAvatar, IonButton, IonIcon, IonInput, IonFab, IonFabButton, IonItem, useIonRouter, IonLabel, IonTextarea} from '@ionic/vue';
	import { inject, ref } from 'vue';
	import { getBlobURL } from '../../lib/util/blob';
	import { getFiles } from '../../lib/util/misc';
	import { resizeImage } from '../../lib/util/image';
	import { modifySystem, system } from '../../lib/db/entities/system';
	import { members } from '../../lib/db/entities/members';

	import {
		peopleOutline as peopleIOS,
		pencilOutline as pencilIOS,
		saveOutline as saveIOS
	} from "ionicons/icons";

	import peopleMD from "@material-design-icons/svg/outlined/groups_2.svg"
	import pencilMD from "@material-design-icons/svg/outlined/edit.svg"
	import saveMD from "@material-design-icons/svg/outlined/save.svg"

	const isIOS = inject<boolean>("isIOS");

	const membersShowed = ref(false);

	async function modifyPicture(){
		const files = await getFiles();
		if(files.length){
			system.value.image = await resizeImage(files[0]);	
		}
	}

	const router: any = inject("navManager");

	async function save() {
		await modifySystem(system.value);
		router.handleNavigateBack("/options/");
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:systemSettings.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<div class="avatar-container">
				<IonAvatar>
					<img aria-hidden="true" :src="system?.image ? getBlobURL(system.image) : (isIOS ? peopleIOS : peopleMD )" />
				</IonAvatar>

				<IonButton shape="round" @click="modifyPicture">
					<IonIcon slot="icon-only" :ios="pencilIOS" :md="pencilMD" />
				</IonButton>
			</div>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>
			<IonList inset>
				<IonItem lines="none">
					<IonInput fill="outline" labelPlacement="floating" :label="$t('options:systemSettings.systemName')" v-model="system.name" />
				</IonItem>
				<IonItem lines="none">
					<IonTextarea mode="md" fill="outline" auto-grow :label="$t('options:systemSettings.systemDescription')" labelPlacement="floating" v-model="system.description" />
				</IonItem>
				<IonItem lines="none">
					<IonLabel>{{ $t("options:systemSettings.memberCount") }}</IonLabel>
					<IonButton slot="end" v-if="!membersShowed" @click="membersShowed = true">{{ $t("options:systemSettings.tapToShow") }}</IonButton>
					<IonLabel slot="end" v-if="membersShowed">{{ $t("options:systemSettings.memberCountText", { memberCount: members.length }) }}</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
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

	ion-content {
		--padding-bottom: 80px;
	}

	ion-input, ion-textarea {
		margin: 16px 0;
	}
</style>
