<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonAvatar, IonButton, IonIcon, IonFab, IonFabButton, IonItem, useIonRouter} from '@ionic/vue';
	import { inject, onMounted, ref } from 'vue';
	import { getBlobURL } from '../../lib/util/blob';
	import { getFiles } from '../../lib/util/misc';
	import { resizeImage } from '../../lib/util/image';
	import { System, getSystem, modifySystem } from '../../lib/db/entities/system';

	import {
		peopleOutline as peopleIOS,
		pencilOutline as pencilIOS,
		saveOutline as saveIOS
	} from "ionicons/icons";

	import peopleMD from "@material-design-icons/svg/outlined/groups_2.svg"
	import pencilMD from "@material-design-icons/svg/outlined/edit.svg"
	import saveMD from "@material-design-icons/svg/outlined/save.svg"

	const isIOS = inject<boolean>("isIOS");

	const system = ref<System>({uuid: "", name: ""});

	const router = useIonRouter();

	onMounted(async () => {
		const s = await getSystem();
		if(s) system.value = s;
	});

	async function modifyPicture(){
		const files = await getFiles();
		if(files.length){
			system.value.image = await resizeImage(files[0]);	
		}
	}

	async function save() {
		await modifySystem(system.value);
		if(window.history.length > 1) {
			router.back();
		} else {
			router.navigate("/options/", "back");
		}

	}

</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					System name and photo
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
			<IonList :inset="isIOS">
				<IonItem>
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

</style>
