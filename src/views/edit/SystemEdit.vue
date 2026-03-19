<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonButton, IonIcon, IonInput, IonFab, IonFabButton, IonItem, IonLabel, useIonRouter, IonTextarea, IonToggle, IonSelect, IonSelectOption } from "@ionic/vue";
	import { getCurrentInstance, onBeforeMount, ref, shallowRef, toRaw, useTemplateRef, watch } from "vue";
	import { getFiles, promptOkCancel, toast, imageClips } from "../../lib/util/misc";
	import { resizeImage } from "../../lib/util/image";
	import { deleteSystem, getSystem, newSystem, updateSystem, countSystemMembers } from "../../lib/db/tables/system";
	import { getMembers } from "../../lib/db/tables/members";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import SystemSelect from "../../modals/SystemSelect.vue";
	import Avatar from "../../components/Avatar.vue";

	import accountCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";
	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg";
	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";
	import PeopleMD from "@material-symbols/svg-600/outlined/group.svg";

	import { appConfig } from "../../lib/config";
	import { useRoute } from "vue-router";
	import { PartialBy } from "../../lib/types";
	import { ImageClip, System } from "../../lib/db/entities";
	import { useTranslation } from "i18next-vue";
	import Markdown from "../../components/Markdown.vue";
	import Color from "../../components/Color.vue";
	import { addMaterialColors, rgbaToArgb, unsetMaterialColors } from "../../lib/theme";
	import Cover from "../../components/Cover.vue";

	const i18next = useTranslation();

	const router = useIonRouter();
	const route = useRoute();

	const self = getCurrentInstance();

	const loading = ref(false);

	const emptySystem: PartialBy<System, "uuid"> = {
		name: "",
		isPinned: false,
		isArchived: false
	};
	const system = ref({ ...emptySystem });

	const parentSystem = shallowRef<System>();

	const systemSelectModal = useTemplateRef("systemSelectModal");

	const membersShowed = ref(false);
	const memberCount = ref(0);
	const archivedMemberCount = ref(0);
	const customFrontCount = ref(0);
	const archivedCustomFrontCount = ref(0);

	const canEdit = ref(true);
	const isEditing = ref(false);

	async function toggleEditing(){
		if(!isEditing.value){
			isEditing.value = true;
			return;
		}

		const uuid = system.value.uuid;
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

	async function modifyPicture(){
		const files = await getFiles();
		if(files.length)
			system.value.image = await resizeImage(files[0]);
	}

	function deletePicture(){
		system.value.image = undefined;
	}

	async function modifyCover(){
		const files = await getFiles();
		if(files.length)
			system.value.cover = await resizeImage(files[0], 1024);
	}

	function deleteCover(){
		system.value.cover = undefined;
	}

	async function removeSystem() {
		if(await promptOkCancel(
			i18next.t("systems:edit.delete.title"),
			undefined,
			i18next.t("systems:edit.delete.confirm")
		)){
			await deleteSystem(system.value.uuid!);
			router.back();
		}
	}

	async function copyIdToClipboard(){
		if(system.value.uuid){
			try{
				await window.navigator.clipboard.writeText(`@<s:${system.value.uuid}>`);
				await toast(i18next.t("systems:edit.systemIDcopiedToClipboard"));
			}catch(_e){
				return;
			}
		}
	}

	async function updateRoute(){
		if(route.name !== "SystemEdit") return;

		loading.value = true;

		if(route.query.uuid){
			const _system = await getSystem(route.query.uuid as string);
			if(_system) system.value = _system;
		} else system.value = { ...emptySystem };

		let _memberCount = 0;
		let _archivedMemberCount = 0;
		let _customFrontCount = 0;
		let _archivedCustomFrontCount = 0;

		for await(const member of getMembers()){
			if(member.system !== system.value.uuid)
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

		if(system.value.parent)
			parentSystem.value = await getSystem(system.value.parent);

		if(route.query.disallowEditing)
			canEdit.value = false;
		else
			canEdit.value = true;
		
		// are we editing?
		isEditing.value = !system.value.uuid;

		// set color
		updateColors();

		loading.value = false;
	}

	function updateColors(){
		if(system.value.color){
			if(self?.vnode.el) addMaterialColors(rgbaToArgb(system.value.color), self?.vnode.el as HTMLElement);
		} else 
			if(self?.vnode.el) unsetMaterialColors(self?.vnode.el as HTMLElement);
	}

	watch(parentSystem, () => {
		if(parentSystem.value) system.value.parent = parentSystem.value.uuid;
		else system.value.parent = undefined;
	});

	watch(route, updateRoute);
	onBeforeMount(updateRoute);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					default-href="/options/"
				/>
				<IonTitle>
					{{ !isEditing
						? $t("systems:edit.header")
						: !system.uuid ? $t("systems:edit.headerAdd") : $t("systems:edit.headerEdit")
					}}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<div class="cover-container">
				<Cover class="cover" :cover="system.cover" />
				<div v-if="isEditing" class="edit-buttons">
					<IonButton shape="round" size="small" @click="modifyCover">
						<IonIcon slot="icon-only" :icon="pencilMD" />
					</IonButton>
					<IonButton
						v-if="system.cover"
						shape="round"
						color="danger"
						size="small"
						@click="deleteCover"
					>
						<IonIcon slot="icon-only" :icon="trashMD" />
					</IonButton>
				</div>

				<div class="avatar-container">
					<Avatar
						:image="system.image"
						:clip-shape="system.imageClip"
						:color="system.color"
						:icon="accountCircle"
					/>
					
					<div v-if="isEditing" class="edit-buttons">
						<IonButton shape="round" size="small" @click="modifyPicture">
							<IonIcon slot="icon-only" :icon="pencilMD" />
						</IonButton>
						<IonButton
							shape="round"
							size="small"
							color="danger"
							@click="deletePicture"
						>
							<IonIcon slot="icon-only" :icon="trashMD" />
						</IonButton>
					</div>
				</div>
			</div>

			<template v-if="!isEditing">
				<div class="system-info">
					<h3>{{ system.name }}</h3>
					<p v-if="system.isArchived">{{ $t("systems:edit.archived") }}</p>
				</div>

				<IonList>
					<IonItem class="system-description">
						<IonLabel>
							<h3>{{ $t("systems:edit.description") }}</h3>
							<Markdown :markdown="system.description || $t('systems:edit.noDescription')" />
						</IonLabel>
					</IonItem>
				</IonList>

				<IonList class="system-actions">
					<IonItem v-if="parentSystem">
						<Avatar
							slot="start"
							:image="parentSystem?.image"
							:clip-shape="parentSystem?.imageClip"
							:color="parentSystem?.color"
							:icon="accountCircle"
						/>
						<IonLabel>
							<p>{{ $t("systems:edit.parent") }}</p>
							<h2>{{ parentSystem.name }}</h2>
						</IonLabel>
					</IonItem>
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
						<IonButton
							v-if="!membersShowed"
							slot="end"
							size="small"
							@click="membersShowed = true"
						>
							{{ $t("systems:edit.tapToShow") }}
						</IonButton>
					</IonItem>
				
					<IonItem button detail :router-link="`/s/members/?q=@system:${system.uuid}`">
						<IonIcon slot="start" :icon="PeopleMD" aria-hidden="true" />
						<IonLabel>{{ $t("systems:edit.showMembers") }}</IonLabel>
					</IonItem>
				</IonList>
			</template>

			<template v-else>
				<IonList class="surface system-edit">
					<IonItem>
						<IonInput
							v-model="system.name"
							fill="solid"
							label-placement="floating"
							:label="$t('systems:edit.name')"
						/>
					</IonItem>

					<IonItem>
						<IonTextarea
							v-model="system.description"
							fill="solid"
							auto-grow
							:label="$t('systems:edit.description')"
							label-placement="floating"
						/>
					</IonItem>
				</IonList>
				
				<IonList>
					<IonItem button :detail="true" @click="systemSelectModal?.$el.present()">
						<Avatar
							slot="start"
							:image="parentSystem?.image"
							:clip-shape="parentSystem?.imageClip"
							:color="parentSystem?.color"
							:icon="accountCircle"
						/>
						<IonLabel>
							<template v-if="parentSystem">
								<p>{{ $t("systems:edit.parent") }}</p>
								<h2>{{ parentSystem.name }}</h2>
							</template>
							<h2 v-else>
								{{ $t("systems:edit.parent") }}
							</h2>
						</IonLabel>
						<IonButton
							v-if="parentSystem"
							slot="end"
							shape="round"
							fill="outline"
							size="small"
							@click="(e: { stopPropagation: () => void; }) => { e.stopPropagation(); parentSystem = undefined; }"
						>
							<IonIcon
								slot="icon-only"
								:icon="trashMD"
								color="danger"
							/>
						</IonButton>
					</IonItem>
					<IonItem button :detail="false">
						<Color v-model="system.color" @update:model-value="updateColors">
							<IonLabel>
								{{ $t("systems:edit.color") }}
							</IonLabel>
						</Color>
						<IonButton
							v-if="system.color"
							slot="end"
							shape="round"
							fill="outline"
							size="small"
							@click="(e: { stopPropagation: () => void; }) => { e.stopPropagation(); system.color = undefined; updateColors() }"
						>
							<IonIcon
								slot="icon-only"
								:icon="trashMD"
								color="danger"
							/>
						</IonButton>
					</IonItem>
					<IonItem>
						<IonSelect
							:model-value="system.imageClip || ''"
							label-placement="floating"
							:label="$t('members:edit.imageClip')"
							:cancel-text="$t('other:alerts.cancel')"
							interface="action-sheet"
							@update:model-value="(v: ImageClip) => { system.imageClip = v.length ? v : undefined; }"
						>
							<IonSelectOption v-for="clip in imageClips" :key="clip" :value="clip">
								{{ $t(`other:shapes.${clip}`) }}
							</IonSelectOption>
							<IonSelectOption :value="''">
								{{ $t(`other:shapes.noShape`) }}
							</IonSelectOption>
						</IonSelect>
					</IonItem>
					<IonItem button :detail="false">
						<IonToggle v-model="system.isPinned">
							<IonLabel>
								{{ $t("systems:edit.isPinned") }}
							</IonLabel>
						</IonToggle>
					</IonItem>
					<IonItem button :detail="false">
						<IonToggle v-model="system.isArchived">
							<IonLabel>
								{{ $t("systems:edit.archived") }}
							</IonLabel>
						</IonToggle>
					</IonItem>
					<IonItem
						v-if="system.uuid && appConfig.defaultSystem !== system.uuid && !countSystemMembers(system.uuid)"
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
						v-if="system.uuid"
						:detail="false"
						button
						@click="copyIdToClipboard"
					>
						<IonLabel>
							<p>{{ $t("systems:edit.systemID", { systemID: system.uuid }) }}</p>
						</IonLabel>
					</IonItem>
				</IonList>
			</template>

			<SystemSelect
				ref="systemSelectModal"
				v-model="parentSystem"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:child-system="system"
			/>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="canEdit" :disabled="isEditing && !system.name.length" @click="toggleEditing">
					<IonIcon :icon="isEditing ? saveMD : pencilMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	div.cover-container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: end;
		width: 100%;
		height: 256px;
		margin-bottom: 16px;
	}

	div.cover-container > div.edit-buttons {
		position: absolute;
		bottom: 8px;
		display: flex;
		flex-direction: column-reverse;
		gap: 8px;
		right: calc(24px + var(--ion-safe-area-right, 0px));
	}

	img.cover {
		mask-image: linear-gradient(black, transparent);
		border-radius: 16px 16px 0 0;
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
		z-index: -1;
		position: absolute;
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

	div.avatar-container .avatar {
		width: 192px;
		height: 192px;
		outline-width: 8px !important;
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
		padding: 16px calc(32px + var(--ion-safe-area-right, 0px)) 0px calc(32px + var(--ion-safe-area-left, 0px));
	}

	div.system-description ion-label {
		color: var(--ion-color-step-600, var(--ion-text-color-step-400, #666666));
	}
</style>