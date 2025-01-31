<script setup lang="ts">
	import { IonContent, IonList, IonPage, IonAvatar, IonButton, IonIcon, IonInput, IonFab, IonFabButton, IonItem, IonTextarea, useIonRouter} from '@ionic/vue';
	import { inject, onMounted, ref } from 'vue';
	import { getObjectURL } from '../../lib/util/blob';
	import { getFiles } from '../../lib/util/misc';
	import { resizeImage } from '../../lib/util/image';
	import { getSystem, modifySystem } from '../../lib/db/tables/system';
	
	import {
		peopleOutline as peopleIOS,
		pencilOutline as pencilIOS,
		arrowForwardOutline as ArrowIOS
	} from "ionicons/icons";

	import peopleMD from "@material-symbols/svg-600/outlined/groups_2.svg"
	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg"
    import ArrowMD from "@material-symbols/svg-600/outlined/arrow_forward.svg";

	const isIOS = inject<boolean>("isIOS");

	const router = useIonRouter();

	const system = ref();

	async function modifyPicture(){
		const files = await getFiles();
		if(files.length){
			if(files[0].type == 'image/gif'){
				system.value.image = files[0];
				return;
			}
			system.value.image = await resizeImage(files[0]);	
		}
	}

	async function save() {
		await modifySystem({...system.value});
		router.push("/onboarding/member");
	}

	onMounted(async () => {
		system.value = await getSystem();
	});
</script>

<template>
	<IonPage>
		<IonContent>
			<h1> {{ $t('onboarding:systemInfo.header') }}</h1>
			<div class="avatar-container">
				<IonAvatar>
					<img aria-hidden="true" :src="system?.image ? getObjectURL(system.image) : (isIOS ? peopleIOS : peopleMD )" />
				</IonAvatar>

				<IonButton shape="round" @click="modifyPicture">
					<IonIcon slot="icon-only" :ios="pencilIOS" :md="pencilMD" />
				</IonButton>
			</div>

			<IonList inset v-if="system">
				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('onboarding:systemInfo.name')" v-model="system.name" />
				</IonItem>

				<IonItem>
					<IonTextarea :fill="!isIOS ? 'outline' : undefined" auto-grow :label="$t('onboarding:systemInfo.description')" labelPlacement="floating" v-model="system.description" />
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save">
					<IonIcon :ios="ArrowIOS" :md="ArrowMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

<style scoped>

	h1 {
		margin-top: 208px;
		text-align: center;
	}

	div.avatar-container {
		position: relative;
		width: fit-content;
		height: fit-content;
		display: block;
		margin-left: auto;
		margin-right: auto;
		margin-top: 24px;
		margin-bottom: 24px;
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

