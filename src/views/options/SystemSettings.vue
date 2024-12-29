<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonAvatar, IonButton, IonIcon, IonInput, IonFab, IonFabButton, IonItem, useIonRouter, IonLabel, IonTextarea} from '@ionic/vue';
	import { inject, onMounted, ref, shallowRef } from 'vue';
	import { getBlobURL } from '../../lib/util/blob';
	import { getFiles } from '../../lib/util/misc';
	import { resizeImage } from '../../lib/util/image';
	import { getSystem, modifySystem } from '../../lib/db/tables/system';
	import { getMembersTable } from '../../lib/db/tables/members';

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
	const memberCount = ref(0);

	const system = shallowRef();

	async function modifyPicture(){
		const files = await getFiles();
		if(files.length){
			system.value.image = await resizeImage(files[0]);	
		}
	}

	const router: any = inject("navManager");

	async function save() {
		await modifySystem({...system.value});
		router.handleNavigateBack("/options/");
	}

	onMounted(async () => {
		system.value = await getSystem();
		memberCount.value = await getMembersTable().count();
	});
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

			<IonList inset v-if="system">
				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('options:systemSettings.systemName')" v-model="system.name" />
				</IonItem>
				<IonItem>
					<IonTextarea :fill="!isIOS ? 'outline' : undefined" auto-grow :label="$t('options:systemSettings.systemDescription')" labelPlacement="floating" v-model="system.description" />
				</IonItem>
				<IonItem>
					<IonLabel>{{ $t("options:systemSettings.memberCount") }}</IonLabel>
					<IonButton slot="end" v-if="!membersShowed" @click="membersShowed = true">{{ $t("options:systemSettings.tapToShow") }}</IonButton>
					<IonLabel slot="end" v-if="membersShowed">{{ $t("options:systemSettings.memberCountText", { memberCount }) }}</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>
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

	.md ion-input, .md ion-textarea {
		margin: 16px 0;
	}
</style>
