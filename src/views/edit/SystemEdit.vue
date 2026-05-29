<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonButton, IonIcon, IonInput, IonFab, IonFabButton, IonItem, IonLabel, useIonRouter, IonTextarea, IonToggle, IonProgressBar } from "@ionic/vue";
	import { getCurrentInstance, onBeforeMount, ref, shallowRef, toRaw, useTemplateRef, watch } from "vue";
	import { promptOkCancel, toast, imageClipPicker, fontFamilyPicker } from "../../lib/util/misc";
	import { getResizedImage } from "../../lib/util/image";
	import { deleteSystem, getSystem, newSystem, updateSystem, countSystemMembers } from "../../lib/db/tables/system";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import SystemSelect from "../../modals/SystemSelect.vue";
	import Avatar from "../../components/Avatar.vue";
	import { lists } from "../../router/lists";

	import accountCircle from "@material-symbols/svg-600/rounded/supervised_user_circle.svg";
	import pencilMD from "@material-symbols/svg-600/rounded/edit.svg";
	import saveMD from "@material-symbols/svg-600/rounded/save.svg";
	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";
	import italicMD from "@material-symbols/svg-600/rounded/format_italic.svg";
	import boldMD from "@material-symbols/svg-600/rounded/format_bold.svg";
	import neonMD from "@material-symbols/svg-600/rounded/highlight.svg";
	import outlineMD from "@material-symbols/svg-600/rounded/ink_highlighter.svg";
	import shadowMD from "@material-symbols/svg-600/rounded/ev_shadow.svg";
	import gradientMD from "@material-symbols/svg-600/rounded/gradient.svg";


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
	import Loading from "../../modals/Loading.vue";

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
	const parents = shallowRef<System[]>();

	const systemSelectModal = useTemplateRef("systemSelectModal");
	const loadingModal = useTemplateRef("loadingModal");

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
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.present();

			if(!uuid){
				const result = await newSystem({
					..._system
				});
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();

				router.back();
				return;
			}

			const result = await updateSystem(_system as System);
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

			isEditing.value = false;
		}catch(e){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

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
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.present();

				const result = await deleteSystem(system.value.uuid!);
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();

				router.back();
			}
		}catch(e){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

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
			if(self?.vnode.el) addMaterialColors(rgbaToArgb(system.value.color), rgbaToArgb(system.value.color), self?.vnode.el as HTMLElement);
		} else 
			if(self?.vnode.el) unsetMaterialColors(self?.vnode.el as HTMLElement);
	}


	async function getParents(){
		const _parents: System[] = [];

		let _system: PartialBy<System, "uuid"> | undefined = structuredClone(toRaw(system.value));
		// for our purpose (disallowing systems to pick themselves or their parents) a system is also its own parent
		if(_system?.uuid) _parents.push(_system as System);

		while(_system){
			if(_system.parent){
				const parent = await getSystem(_system.parent);
				if(parent){
					_parents.push(parent);
					_system = parent;
				}
			} else 
				_system = undefined;
		}

		parents.value = _parents;
	}

	watch(parentSystem, async () => {
		if(parentSystem.value) system.value.parent = parentSystem.value.uuid;
		else system.value.parent = undefined;

		await getParents();
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
					default-href="/"
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
					<h3
						:style="{
							fontFamily: system.nameStyle?.family,
							fontWeight: system.nameStyle?.weight,
							fontStyle: system.nameStyle?.italic ? 'italic' : undefined,
							'--system-color': system.color
						}"
						:class="{
							'with-font-family': !!system.nameStyle,
							'neon': system.nameStyle?.neon,
							'outline': system.nameStyle?.outline,
							'shadow': system.nameStyle?.shadow,
							'gradient': system.nameStyle?.gradient
						}"
					>
						{{ system.name }}
					</h3>
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
				
					<IonItem button detail :router-link="`/lists/members/?q=@system:${system.uuid}`">
						<IonIcon slot="start" :icon="lists.members.icon" aria-hidden="true" />
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
					<IonItem
						button
						detail
						@click="fontFamilyPicker($t('systems:edit.nameStyle')).then(res => {
							if(typeof res === 'undefined') return;
							if(res !== null){
								system.nameStyle = {
									family: res,
									italic: system.nameStyle?.italic || false,
									weight: system.nameStyle?.weight || 400,
									neon: system.nameStyle?.neon || false,
									outline: system.nameStyle?.outline || false,
									shadow: system.nameStyle?.shadow || false,
									gradient: system.nameStyle?.gradient || false
								};
							} else
								system.nameStyle = undefined;
						})"
					>
						<IonLabel>
							<h3>{{ $t("systems:edit.nameStyle") }}</h3>
							<p>{{ system.nameStyle?.family || $t("other:fonts.noFont") }}</p>
						</IonLabel>
					</IonItem>
					<IonItem v-if="system.nameStyle">
						<div class="name-style-buttons">
							<IonButton
								shape="round"
								:fill="system.nameStyle.weight > 400 ? 'solid' : 'outline'"
								size="small"
								@click="(e) => {
									e.stopPropagation();
									system.nameStyle!.weight = system.nameStyle!.weight > 400 ? 400 : 700;
								}"
							>
								<IonIcon
									slot="icon-only"
									:icon="boldMD"
								/>
							</IonButton>
							<IonButton
								class="last-button"
								shape="round"
								:fill="system.nameStyle.italic ? 'solid' : 'outline'"
								size="small"
								@click="(e) => {
									e.stopPropagation();
									system.nameStyle!.italic = !system.nameStyle?.italic;
								}"
							>
								<IonIcon
									slot="icon-only"
									:icon="italicMD"
								/>
							</IonButton>
							<IonButton
								shape="round"
								:fill="system.nameStyle.outline ? 'solid' : 'outline'"
								size="small"
								@click="(e) => {
									e.stopPropagation();
									system.nameStyle!.outline = !system.nameStyle?.outline;
									if(system.nameStyle?.outline)
										system.nameStyle.gradient = false;
								}"
							>
								<IonIcon
									slot="icon-only"
									:icon="outlineMD"
								/>
							</IonButton>

							<IonButton
								class="last-button"
								shape="round"
								:fill="system.nameStyle.gradient ? 'solid' : 'outline'"
								size="small"
								@click="(e) => {
									e.stopPropagation();
									system.nameStyle!.gradient = !system.nameStyle?.gradient;
									if(system.nameStyle?.gradient){
										system.nameStyle.outline = false;
									}
								}"
							>
								<IonIcon
									slot="icon-only"
									:icon="gradientMD"
								/>
							</IonButton>

							<IonButton
								shape="round"
								:fill="system.nameStyle.neon ? 'solid' : 'outline'"
								size="small"
								@click="(e) => {
									e.stopPropagation();
									system.nameStyle!.neon = !system.nameStyle?.neon;
									if(system.nameStyle?.neon){
										system.nameStyle.shadow = false;
									}
								}"
							>
								<IonIcon
									slot="icon-only"
									:icon="neonMD"
								/>
							</IonButton>
							<IonButton
								class="last-button"
								shape="round"
								:fill="system.nameStyle.shadow ? 'solid' : 'outline'"
								size="small"
								@click="(e) => {
									e.stopPropagation();
									system.nameStyle!.shadow = !system.nameStyle?.shadow;
									if(system.nameStyle?.shadow){
										system.nameStyle.neon = false;
									}
								}"
							>
								<IonIcon
									slot="icon-only"
									:icon="shadowMD"
								/>
							</IonButton>
						</div>
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
				:model-value="parentSystem ? [parentSystem] : []"
				:discard-on-select="true"
				always-emit
				:only-one="true"
				:hide-checkboxes="false"
				:systems-to-exclude="parents"
				@update:model-value="e => { if(e[0]) parentSystem = e[0] }"
			/>

			<Loading ref="loadingModal" />

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

		h3.with-font-family {
			line-height: normal;

			&.outline {
				-webkit-text-stroke: 0.3rem rgb(var(--md3-primary-container));
				paint-order: stroke fill markers;
			}

			&.neon {
				color: white;
				text-shadow:
					0px 0px 1px currentColor,
					0px 0px 2px currentColor,
					0px 0px 4px currentColor;
				filter:
					drop-shadow(0px 0px 8px var(--system-color, var(--ion-color-primary)))
					drop-shadow(0px 0px 32px var(--system-color, var(--ion-color-primary)));

				&.outline {
					-webkit-text-stroke: 0.3rem var(--system-color, var(--ion-color-primary));
				}

				&.gradient {
					background-image: linear-gradient(to top, rgb(var(--md3-primary-container)) 0%, rgb(var(--md3-dark-on-surface)) 100%);
					background-clip: text;
					color: transparent;
				}
			}

			&.shadow {
				filter:
					drop-shadow(0.5px 0.5px rgb(var(--md3-primary-container)))
					drop-shadow(1px 1px rgb(var(--md3-primary-container)))
					drop-shadow(1.5px 1.5px rgb(var(--md3-primary-container)))
					drop-shadow(2px 2px rgb(var(--md3-primary-container)))
					drop-shadow(2.5px 2.5px rgb(var(--md3-primary-container)))
			}

			&.gradient {
				background-image: linear-gradient(to top, rgb(var(--md3-primary-container)) 0%, rgb(var(--md3-on-surface)) 100%);
				background-clip: text;
				color: transparent;
			}
		}

		h3:not(.with-font-family) {
			font-family: var(--ampersand-header-font-name), var(--ion-font-family);
			font-style: var(--ampersand-header-font-style);
			font-weight: var(--ampersand-header-font-weight);
			font-feature-settings: var(--ampersand-header-font-features);
			font-variation-settings: var(--ampersand-header-font-variation);
		}
	}

	.system-description ion-label {
		margin: 0;
	}


	div.name-style-buttons {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
	}

	ion-button.last-button {
		margin-inline-end: 1em;
	}
</style>