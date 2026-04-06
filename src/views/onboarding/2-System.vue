<script setup lang="ts">
	import { IonContent, IonList, IonPage, IonButton, IonIcon, IonInput, IonFab, IonFabButton, IonItem, IonTextarea, useIonRouter } from "@ionic/vue";
	import { onBeforeMount, ref, toRaw } from "vue";
	import Avatar from "../../components/Avatar.vue";
	import { slideAnimation, toast } from "../../lib/util/misc";
	import { getResizedImage } from "../../lib/util/image";
	import { getSystem, newSystem, updateSystem } from "../../lib/db/tables/system";

	import accountCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";
	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg";
	import ArrowMD from "@material-symbols/svg-600/outlined/arrow_forward.svg";
	import { System } from "../../lib/db/entities";
	import { PartialBy } from "../../lib/types";
	import { appConfig } from "../../lib/config";
	import Spinner from "../../components/Spinner.vue";

	const loadingBar = ref(false);

	const router = useIonRouter();

	const emptySystem: PartialBy<System, "uuid"> = { name: "", isArchived: false, isPinned: false, viewInLists: true };
	const system = ref<PartialBy<System, "uuid">>({ ...emptySystem });

	async function modifyPicture(){
		loadingBar.value = true;
		const image = await getResizedImage();
		if(image) system.value.image = image;
		loadingBar.value = false;
	}

	async function save() {
		const uuid = system.value.uuid;
		const _system = toRaw(system.value);

		try{
			if(!uuid){
				const result = await newSystem({
					..._system
				});
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);
			} else {
				const result = await updateSystem(_system as System);
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);
			}
			
			router.replace("/onboarding/member/", slideAnimation);
		}catch(e){
			await toast((e as Error).message);
		}
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
				<h1>{{ $t('onboarding:systemInfo.header') }}</h1>
				<Spinner v-if="loadingBar" size="192px" />
				<div v-else class="avatar-container">
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

