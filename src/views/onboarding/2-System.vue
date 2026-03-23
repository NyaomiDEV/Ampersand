<script setup lang="ts">
	import { IonContent, IonList, IonPage, IonButton, IonIcon, IonInput, IonFab, IonFabButton, IonItem, IonTextarea, useIonRouter } from "@ionic/vue";
	import { onBeforeMount, ref, toRaw } from "vue";
	import Avatar from "../../components/Avatar.vue";
	import { slideAnimation } from "../../lib/util/misc";
	import { getResizedImage } from "../../lib/util/image";
	import { getSystem, newSystem, updateSystem } from "../../lib/db/tables/system";

	import accountCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";
	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg";
	import ArrowMD from "@material-symbols/svg-600/outlined/arrow_forward.svg";
	import { System } from "../../lib/db/entities";
	import { PartialBy } from "../../lib/types";
	import { appConfig } from "../../lib/config";

	const router = useIonRouter();

	const emptySystem: PartialBy<System, "uuid"> = { name: "", isArchived: false, isPinned: false };
	const system = ref<PartialBy<System, "uuid">>({ ...emptySystem });

	async function modifyPicture(){
		system.value.image = await getResizedImage();
	}

	async function save() {
		if(!await getSystem(appConfig.defaultSystem)) {
			const uuid = await newSystem({ ...toRaw(system.value) });
			if(uuid) appConfig.defaultSystem = uuid;
		} else
			await updateSystem(appConfig.defaultSystem, { ...toRaw(system.value) });
	
		router.replace("/onboarding/member/", slideAnimation);
	}

	onBeforeMount(async () => {
		const sys = await getSystem(appConfig.defaultSystem);
		if(sys) system.value = sys;
	});
</script>

<template>
	<IonPage>
		<IonContent>
			<div class="container">
				<h1> {{ $t('onboarding:systemInfo.header') }}</h1>
				<div class="avatar-container">
					<Avatar
						:image="system.image"
						:clip-shape="system.imageClip"
						:color="system.color"
						:icon="accountCircle"
					/>

					<IonButton shape="round" size="small" @click="modifyPicture">
						<IonIcon slot="icon-only" :icon="pencilMD" />
					</IonButton>
				</div>

				<IonList v-if="system" class="surface">
					<IonItem>
						<IonInput
							v-model="system.name"
							fill="solid"
							label-placement="floating"
							:label="$t('onboarding:systemInfo.name')"
						/>
					</IonItem>

					<IonItem>
						<IonTextarea
							v-model="system.description"
							fill="solid"
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

	.avatar {
		width: 192px;
		height: 192px;
	}

	div.avatar-container ion-button {
		position: absolute;
		bottom: 8px;
		right: 8px;
	}
</style>

