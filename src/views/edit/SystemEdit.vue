<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonButton, IonIcon, IonInput, IonFab, IonFabButton, IonItem, IonLabel, useIonRouter, IonTextarea, IonToggle, IonProgressBar } from "@ionic/vue";
	import { getCurrentInstance, onBeforeMount, ref, shallowRef, toRaw, useTemplateRef, watch } from "vue";
	import { promptOkCancel, toast, imageClipPicker } from "../../lib/util/misc";
	import { getResizedImage } from "../../lib/util/image";
	import { deleteSystem, getSystem, newSystem, updateSystem, countSystemMembers } from "../../lib/db/tables/system";
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
	import { System } from "../../lib/db/entities";
	import { useTranslation } from "i18next-vue";
	import Markdown from "../../components/Markdown.vue";
	import Color from "../../components/Color.vue";
	import { addMaterialColors, rgbaToArgb, unsetMaterialColors } from "../../lib/theme";
	import Cover from "../../components/Cover.vue";
	import SystemItem from "../../components/system/SystemItem.vue";

	const i18next = useTranslation();

	const router = useIonRouter();
	const route = useRoute();

	const self = getCurrentInstance();

	const loading = ref(false);
	const loadingBar = ref(false);

	const emptySystem: PartialBy<System, "uuid"> = {
		name: "",
		isPinned: false,
		isArchived: false,
		viewInLists: true
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

		try{
			if(!uuid){
				const result = await newSystem({
					..._system
				});
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				router.back();
				return;
			}

			const result = await updateSystem(_system as System);
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

			isEditing.value = false;
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function modifyPicture(){
		loadingBar.value = true;
		const image = await getResizedImage();
		if(image) system.value.image = image;
		loadingBar.value = false;
	}

	function deletePicture(){
		system.value.image = undefined;
	}

	async function modifyCover(){
		loadingBar.value = true;
		const image = await getResizedImage(1024);
		if(image) system.value.cover = image;
		loadingBar.value = false;
	}

	function deleteCover(){
		system.value.cover = undefined;
	}

	async function removeSystem() {
		try{
			if(await promptOkCancel(
				i18next.t("systems:edit.delete.title"),
				undefined,
				i18next.t("systems:edit.delete.confirm")
			)){
				const result = await deleteSystem(system.value.uuid!);
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				router.back();
			}
		}catch(e){
			await toast((e as Error).message);
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

		if(system.value.uuid){
			const _count = countSystemMembers(system.value.uuid);

			memberCount.value = _count.normal;
			archivedMemberCount.value = _count.archived;
			customFrontCount.value = _count.customFronts;
			archivedCustomFrontCount.value = _count.archivedCustomFronts;
		}

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
				<IonProgressBar v-if="loadingBar" type="indeterminate" />
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
					<SystemItem
						v-if="parentSystem"
						:show-cover="false"
						:show-effects="false"
						:show-icons="false"
						:system="parentSystem"
					>
						<template #before>
							<p>{{ $t("systems:edit.parent") }}</p>
						</template>
					</SystemItem>
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
					<SystemItem
						v-if="parentSystem"
						button
						:show-cover="false"
						:show-effects="false"
						:show-icons="false"
						:system="parentSystem"
						@click="systemSelectModal?.$el.present()"
					>
						<template #before>
							<p>{{ $t("systems:edit.parent") }}</p>
						</template>
						<template #end>
							<IonButton
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
						</template>
					</SystemItem>
					<IonItem
						v-else
						button
						detail
						@click="systemSelectModal?.$el.present()"
					>
						<IonLabel>
							<h2>{{ $t("systems:edit.parent") }}</h2>
						</IonLabel>
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
					<IonItem button detail @click="imageClipPicker($t('systems:edit.imageClip')).then(res => { if(res !== undefined) system.imageClip = res ?? undefined; })">
						<IonLabel>
							<h3>{{ $t("systems:edit.imageClip") }}</h3>
							<p>{{ system.imageClip ? $t(`other:shapes.${system.imageClip}`) : $t("other:shapes.noShape") }}</p>
						</IonLabel>
					</IonItem>
					<IonItem button :detail="false">
						<IonToggle v-model="system.viewInLists">
							<IonLabel>
								{{ $t("systems:edit.viewInLists") }}
							</IonLabel>
						</IonToggle>
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
						v-if="system.uuid && appConfig.defaultSystem !== system.uuid && !memberCount && !archivedMemberCount && !customFrontCount && !archivedCustomFrontCount"
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
				always-emit
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

		> div.edit-buttons {
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

		> div.edit-buttons {
			position: absolute;
			bottom: 8px;
			width: 100%;
			display: flex;
			justify-content: space-between;
			flex-direction: row-reverse;
		}

		.avatar {
			width: 192px;
			height: 192px;

			&.with-outline > :deep(ion-avatar) {
				outline-width: 8px !important;
			}
		}
	}

	div.edit-buttons ion-button {
		margin: 0;
	}

	div.system-info {
		display: block;
		margin: auto;
		text-align: center;

		* {
			margin: 0;
		}
	}

	.system-description ion-label {
		margin: 0;
	}
</style>