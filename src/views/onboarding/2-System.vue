<script setup lang="ts">
	import { IonContent, IonList, IonPage, IonAvatar, IonButton, IonIcon, IonInput, IonFab, IonFabButton, IonItem, IonTextarea, useIonRouter } from "@ionic/vue";
	import { onBeforeMount, ref, toRaw } from "vue";
	import { getObjectURL } from "../../lib/util/blob";
	import { getFiles, slideAnimation } from "../../lib/util/misc";
	import { resizeImage } from "../../lib/util/image";
	import { getSystem, newSystem, updateSystem } from "../../lib/db/tables/system";

	import accountCircle from "@material-symbols/svg-600/outlined/account_circle.svg";
	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg";
	import ArrowMD from "@material-symbols/svg-600/outlined/arrow_forward.svg";
	import { System } from "../../lib/db/entities";
	import { PartialBy } from "../../lib/types";
	import { appConfig } from "../../lib/config";
	import { newFile, updateFile } from "../../lib/db/tables/files";

	const router = useIonRouter();

	const emptySystem: PartialBy<System, "id"> = { name: "" };
	const system = ref<PartialBy<System, "id">>({ ...emptySystem });
	const systemAvatarUri = ref();

	async function modifyPicture(){
		const files = await getFiles();
		if(files.length){
			let _file: File;
			if(files[0].type === "image/gif"){
				_file = files[0];
				return;
			}
			_file = await resizeImage(files[0]);
			if(system.value.image)
				await updateFile(system.value.image.id, undefined, _file.stream());
			else 
				system.value.image = await newFile(_file.name, _file.stream());
		}

		await updateAvatarUri();
	}

	async function updateAvatarUri(){
		if(system.value.image)
			systemAvatarUri.value = await getObjectURL(system.value.image);
	}

	async function save() {
		if(!await getSystem(appConfig.defaultSystem)) {
			const id = (await newSystem({ ...toRaw(system.value) }))?.id;
			if(id) appConfig.defaultSystem = id;
		} else
			await updateSystem(appConfig.defaultSystem, { ...toRaw(system.value) });
	
		router.replace("/onboarding/member/", slideAnimation);
	}

	onBeforeMount(async () => {
		const sys = await getSystem(appConfig.defaultSystem);
		if(sys) system.value = sys;
		await updateAvatarUri();
	});
</script>

<template>
	<IonPage>
		<IonContent>
			<div class="container">
				<h1> {{ $t('onboarding:systemInfo.header') }}</h1>
				<div class="avatar-container">
					<IonAvatar>
						<img v-if="systemAvatarUri" aria-hidden="true" :src="systemAvatarUri" />
						<IonIcon v-else :icon="accountCircle" />
					</IonAvatar>

					<IonButton shape="round" @click="modifyPicture">
						<IonIcon slot="icon-only" :icon="pencilMD" />
					</IonButton>
				</div>

				<IonList v-if="system" inset>
					<IonItem>
						<IonInput
							v-model="system.name"
							fill="outline"
							label-placement="floating"
							:label="$t('onboarding:systemInfo.name')"
						/>
					</IonItem>

					<IonItem>
						<IonTextarea
							v-model="system.description"
							fill="outline"
							auto-grow
							:label="$t('onboarding:systemInfo.description')"
							label-placement="floating"
						/>
					</IonItem>
				</IonList>
			</div>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton :disabled="!system.name.length" @click="save">
					<IonIcon :icon="ArrowMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

<style scoped>

	.container {
		width: 100%;
		min-height: 100%;
		display: flex;
		align-items: stretch;
		justify-content: center;
		flex-direction: column;
		padding: 1em;
	}

	h1 {
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

	div.avatar-container ion-avatar ion-icon {
		width: 100%;
		height: 100%;
		color: var(--ion-color-primary);
	}
</style>

