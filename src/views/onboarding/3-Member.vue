<script setup lang="ts">
	import {
		IonContent,
		IonButton,
		IonIcon,
		IonList,
		IonInput,
		IonTextarea,
		IonFab,
		IonFabButton,
		IonItem,
		IonPage,
		useIonRouter
	} from "@ionic/vue";

	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg";
	import arrowMD from "@material-symbols/svg-600/outlined/arrow_forward.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";
	import accountCircle from "@material-symbols/svg-600/outlined/account_circle-fill.svg";

	import { Member } from "../../lib/db/entities";
	import { newMember } from "../../lib/db/tables/members";
	import { slideAnimation, toast } from "../../lib/util/misc";
	import { getResizedImage } from "../../lib/util/image";
	import { ref, toRaw } from "vue";
	import { PartialBy } from "../../lib/types";
	import Avatar from "../../components/Avatar.vue";
	import { appConfig } from "../../lib/config";
	import Spinner from "../../components/Spinner.vue";

	const loadingBar = ref(false);

	const router = useIonRouter();

	const emptyMember: PartialBy<Member, "uuid" | "dateCreated"> = {
		name: "",
		system: appConfig.defaultSystem,
		isArchived: false,
		isCustomFront: false,
		isPinned: false,
		tags: []
	};
	const member = ref({ ...emptyMember });

	async function modifyPicture(){
		loadingBar.value = true;
		const image = await getResizedImage();
		if(image) member.value.image = image;
		loadingBar.value = false;
	}

	function deletePicture(){
		delete member.value.image;
	}

	async function save(){
		try{
			const _member = toRaw(member.value);
			const result = await newMember({
				..._member,
				dateCreated: new Date()
			});
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);
			router.replace("/onboarding/end/", slideAnimation);
		}catch(e){
			await toast((e as Error).message);
		}
		
	}
</script>

<template>
	<IonPage>
		<IonContent>
			<div class="container">
				<h1>{{ $t('onboarding:memberInfo.header') }}</h1>
				<Spinner v-if="loadingBar" size="192px" />
				<div v-else class="avatar-container">
					<Avatar
						:image="member.image"
						:clip-shape="member.imageClip"
						:color="member.color"
						:icon="accountCircle"
					/>
					<div class="edit-buttons">
						<IonButton shape="round" size="small" @click="modifyPicture">
							<IonIcon slot="icon-only" :icon="pencilMD" />
						</IonButton>
						<IonButton
							v-if="member.image"
							shape="round"
							size="small"
							color="danger"
							@click="deletePicture"
						>
							<IonIcon slot="icon-only" :icon="trashMD" />
						</IonButton>
					</div>
				</div>

				<IonList class="member-edit surface">
					<IonItem>
						<IonInput
							v-model="member.name"
							fill="solid"
							:label="$t('members:edit.name')"
							label-placement="floating"
						/>
					</IonItem>

					<IonItem>
						<IonInput
							v-model="member.pronouns"
							fill="solid"
							:label="$t('members:edit.pronouns')"
							label-placement="floating"
						/>
					</IonItem>

					<IonItem>
						<IonTextarea
							v-model="member.description"
							fill="solid"
							auto-grow
							:label="$t('onboarding:memberInfo.description')"
							label-placement="floating"
						/>
					</IonItem>
				</IonList>

				<p>{{ $t("onboarding:memberInfo:invitation") }}</p>
			</div>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton :disabled="!member.name.length" @click="save">
					<IonIcon :icon="arrowMD" />
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

	h1, p {
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
		margin-bottom: 16px;
	}

	.avatar {
		width: 192px;
		height: 192px;
		outline-width: 8px !important;
	}

	div.avatar-container > div.edit-buttons {
		position: absolute;
		bottom: 8px;
		width: 100%;
		display: flex;
		justify-content: space-between;
		flex-direction: row-reverse;
	}
</style>