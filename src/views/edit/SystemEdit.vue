<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonAvatar, IonButton, IonIcon, IonInput, IonFab, IonFabButton, IonItem, IonLabel, useIonRouter, IonTextarea } from "@ionic/vue";
	import { onBeforeMount, ref, toRaw, watch } from "vue";
	import { getObjectURL } from "../../lib/util/blob";
	import { promptOkCancel, toast } from "../../lib/util/misc";
	import { deleteSystem, getSystem, newSystem, updateSystem } from "../../lib/db/tables/system";
	import { getMembers } from "../../lib/db/tables/members";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import accountCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";
	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg";
	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";
	import { appConfig } from "../../lib/config";
	import { useRoute } from "vue-router";
	import { PartialBy } from "../../lib/types";
	import { SQLFile, System, UUID } from "../../lib/db/entities";
	import { useTranslation } from "i18next-vue";
	import Markdown from "../../components/Markdown.vue";
	import { uploadImage } from "../../lib/db/tables/files";

	const i18next = useTranslation();

	const router = useIonRouter();
	const route = useRoute();

	const loading = ref(false);

	const emptySystem: PartialBy<System, "id"> = {
		name: ""
	};
	const system = ref({ ...emptySystem });
	const systemAvatarUri = ref();

	const membersShowed = ref(false);
	const memberCount = ref(0);
	const archivedMemberCount = ref(0);
	const customFrontCount = ref(0);
	const archivedCustomFrontCount = ref(0);

	const canEdit = ref(true);
	const isEditing = ref(false);

	async function modifyPicture(){
		system.value.image = await uploadImage();
		await updateAvatarUri();
	}

	function deletePicture(){
		if(system.value.image)
			delete system.value.image;
	}

	async function updateAvatarUri(){
		if(system.value.image)
			systemAvatarUri.value = await getObjectURL(system.value.image as SQLFile);
	}

	async function removeSystem() {
		if(await promptOkCancel(
			i18next.t("systems:edit.delete.title"),
			i18next.t("systems:edit.delete.confirm")
		)){
			await deleteSystem(system.value.id!);
			router.back();
		}
	}

	async function copyIdToClipboard(){
		if(system.value.id){
			try{
				await window.navigator.clipboard.writeText(`@<s:${system.value.id}>`);
				await toast(i18next.t("systems:edit.systemIDcopiedToClipboard"));
			}catch(_e){
				return;
			}
		}
	}

	async function toggleEditing(){
		if(!isEditing.value){
			isEditing.value = true;
			return;
		}

		const uuid = system.value.id;
		const _system = toRaw(system.value);

		if(!uuid){
			await newSystem({
				..._system
			});
			router.back();

			return;
		}

		await updateSystem(uuid, _system);

		isEditing.value = false;
	}

	async function updateRoute(){
		if(route.name !== "SystemEdit") return;

		loading.value = true;

		if(route.query.uuid){
			const _system = await getSystem(route.query.uuid as UUID);
			if(_system) system.value = _system;
		} else system.value = { ...emptySystem };
		
		await updateAvatarUri();

		let _memberCount = 0;
		let _archivedMemberCount = 0;
		let _customFrontCount = 0;
		let _archivedCustomFrontCount = 0;

		for await(const member of getMembers()){
			if(member.system.id !== system.value.id)
				continue;

			if(!member.isCustomFront){
				if(member.isArchived)
					_archivedMemberCount++;
				else
					_memberCount++;
			} else {
				if(member.isArchived)
					_archivedCustomFrontCount++;
				else
					_customFrontCount++;
			}
		}

		memberCount.value = _memberCount;
		archivedMemberCount.value = _archivedMemberCount;
		customFrontCount.value = _customFrontCount;
		archivedCustomFrontCount.value = _archivedCustomFrontCount;

		if(route.query.disallowEditing)
			canEdit.value = false;
		else
			canEdit.value = true;
		
		// are we editing?
		isEditing.value = !system.value.id;

		loading.value = false;
	}

	watch(route, updateRoute);
	onBeforeMount(updateRoute);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					:icon="backMD"
					default-href="/options/"
				/>
				<IonTitle>
					{{ !isEditing
						? $t("systems:edit.header")
						: !system.id ? $t("systems:edit.headerAdd") : $t("systems:edit.headerEdit")
					}}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<div class="avatar-container">
				<IonAvatar>
					<img v-if="systemAvatarUri" aria-hidden="true" :src="systemAvatarUri" />
					<IonIcon v-else :icon="accountCircle" />
				</IonAvatar>

				<div v-if="isEditing" class="edit-buttons">
					<IonButton shape="round" @click="modifyPicture">
						<IonIcon slot="icon-only" :icon="pencilMD" />
					</IonButton>
					<IonButton shape="round" color="danger" @click="deletePicture">
						<IonIcon slot="icon-only" :icon="trashMD" />
					</IonButton>
				</div>
			</div>

			<div v-if="!isEditing" class="system-info">
				<h1>{{ system.name }}</h1>
			</div>

			<div v-if="!isEditing" class="system-description">
				<IonLabel>{{ $t("systems:edit.description") }}</IonLabel>
				<Markdown :markdown="system.description || $t('systems:edit.noDescription')" />
			</div>

			<IonList v-if="!isEditing" class="system-actions">
				<IonItem>
					<IonLabel>
						<h2>{{ $t("systems:edit.memberCount") }}</h2>
						<p v-if="membersShowed">
							{{ $t("systems:edit.memberCountText", {
								totalMemberCount: memberCount + archivedMemberCount,
								memberCount,
								archivedMemberCount
							}) }}
							<br />
							{{ $t("systems:edit.customFrontCountText", {
								totalCustomFrontCount: customFrontCount + archivedCustomFrontCount,
								customFrontCount,
								archivedCustomFrontCount
							}) }}
						</p>
					</IonLabel>
					<IonButton v-if="!membersShowed" slot="end" @click="membersShowed = true">{{ $t("systems:edit.tapToShow") }}</IonButton>
				</IonItem>
			</IonList>

			<IonList v-if="isEditing" class="system-edit" inset>
				<IonItem>
					<IonInput
						v-model="system.name"
						fill="outline"
						label-placement="floating"
						:label="$t('systems:edit.name')"
					/>
				</IonItem>

				<IonItem>
					<IonTextarea
						v-model="system.description"
						fill="outline"
						auto-grow
						:label="$t('systems:edit.description')"
						label-placement="floating"
					/>
				</IonItem>

				<IonItem
					v-if="system.id && appConfig.defaultSystem !== system.id"
					button
					:detail="false"
					@click="removeSystem"
				>
					<IonIcon
						slot="start"
						:icon="trashMD"
						aria-hidden="true"
						color="danger"
					/>
					<IonLabel color="danger">
						<h3>{{ $t("systems:edit.delete.title") }}</h3>
						<p>{{ $t("other:genericDeleteDesc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem
					v-if="system.id"
					:detail="false"
					button
					@click="copyIdToClipboard"
				>
					<IonLabel>
						<p>{{ $t("systems:edit.systemID", { systemID: system.id }) }}</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="canEdit" :disabled="isEditing && !system.name.length" @click="toggleEditing">
					<IonIcon :icon="isEditing ? saveMD : pencilMD" />
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

	div.avatar-container > div.edit-buttons {
		position: absolute;
		bottom: 8px;
		width: 100%;
		display: flex;
		justify-content: space-between;
		flex-direction: row-reverse;
	}

	div.edit-buttons ion-button {
		margin: 0;
	}

	ion-avatar {
		width: 192px;
		height: 192px;
	}

	ion-avatar ion-icon {
		width: 100%;
		height: 100%;
		color: var(--ion-color-primary);
	}

	div.system-info {
		display: block;
		margin: auto;
		text-align: center;
	}

	div.system-info * {
		margin: 0;
	}

	div.system-description {
		padding: 16px calc(16px + var(--ion-safe-area-right, 0px)) 0px calc(16px + var(--ion-safe-area-left, 0px));
	}

	div.system-description ion-label {
		color: var(--ion-color-step-600, var(--ion-text-color-step-400, #666666));
	}
</style>