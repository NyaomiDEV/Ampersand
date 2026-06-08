<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonButton,
		IonIcon,
		IonList,
		IonInput,
		IonToggle,
		IonTextarea,
		IonFab,
		IonFabButton,
		IonLabel,
		IonItem,
		IonBackButton,
		useIonRouter,
		IonPage,
		IonProgressBar
	} from "@ionic/vue";
	import Color from "../../components/Color.vue";
	import TagChip from "../../components/tag/TagChip.vue";

	import TagListSelect from "../../modals/TagListSelect.vue";

	import pencilMD from "@material-symbols/svg-600/rounded/edit.svg";
	import saveMD from "@material-symbols/svg-600/rounded/save.svg";
	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";
	import addMD from "@material-symbols/svg-600/rounded/add.svg";
	import italicMD from "@material-symbols/svg-600/rounded/format_italic.svg";
	import boldMD from "@material-symbols/svg-600/rounded/format_bold.svg";
	import neonMD from "@material-symbols/svg-600/rounded/highlight.svg";
	import outlineMD from "@material-symbols/svg-600/rounded/ink_highlighter.svg";
	import shadowMD from "@material-symbols/svg-600/rounded/ev_shadow.svg";
	import gradientMD from "@material-symbols/svg-600/rounded/gradient.svg";
	import accountCircle from "@material-symbols/svg-600/rounded/account_circle-fill.svg";

	import { CustomField, Member, System, Tag } from "../../lib/db/entities";
	import { newMember, deleteMember, updateMember, defaultMember, getMember } from "../../lib/db/tables/members";
	import { getTags, isValidTag } from "../../lib/db/tables/tags";
	import { fontFamilyPicker, promptOkCancel, sortName, toast, formatDate, imageClipPicker, saveImageFile } from "../../lib/util/misc";
	import { encodeImageWithMetadata, getImageOrMetadata, getResizedImage } from "../../lib/util/image";
	import { getCurrentInstance, onBeforeMount, ref, shallowRef, toRaw, useTemplateRef, watch } from "vue";
	import Markdown from "../../components/Markdown.vue";
	import { addMaterialColors, rgbaToArgb, unsetMaterialColors } from "../../lib/theme";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import { useTranslation } from "i18next-vue";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import Avatar from "../../components/Avatar.vue";
	import Cover from "../../components/Cover.vue";
	import SystemSelect from "../../modals/SystemSelect.vue";
	import { getCustomFields, isValidCustomField } from "../../lib/db/tables/customFields";
	import CustomFieldsSelect from "../../modals/CustomFieldsSelect.vue";
	import { accessibilityConfig, appConfig } from "../../lib/config";
	import { getSystem } from "../../lib/db/tables/system";
	import SystemChip from "../../components/system/SystemChip.vue";
	import SystemItem from "../../components/system/SystemItem.vue";
	import Loading from "../../modals/Loading.vue";
	import { lists } from "../../router/lists";
	import { getAsset, getAssetsIndex } from "../../lib/db/tables/assets.ts";
	import { useAssetFonts } from "../../lib/assetFonts.ts";

	const { appendFont, deleteAllFonts } = useAssetFonts();

	const i18next = useTranslation();

	const router = useIonRouter();
	const route = useRoute();

	const loading = ref(false);
	const loadingBar = ref(false);

	const emptyMember: PartialBy<Member, "uuid" | "dateCreated"> = {
		name: "",
		system: appConfig.defaultSystem,
		isArchived: false,
		isCustomFront: false,
		isPinned: false,
		tags: []
	};
	const member = ref({ ...emptyMember });

	const system = ref<System>({ uuid: member.value.system, name: "", isPinned: false, isArchived: false, viewInLists: true });
	const tags = shallowRef<Tag[]>([]);
	const tagSelectionModal = useTemplateRef("tagSelectionModal");
	const systemSelectModal = useTemplateRef("systemSelectModal");
	const loadingModal = useTemplateRef("loadingModal");

	const customFields = shallowRef<CustomField[]>([]);
	const customFieldsToShowInEditMode = shallowRef<CustomField[]>([]);
	const customFieldsToShowInViewMode = shallowRef<CustomField[]>([]);
	const customFieldsSelectionModal = useTemplateRef("customFieldsSelectionModal");

	const canEdit = ref(true);
	const isEditing = ref(false);
	const self = getCurrentInstance();

	let eggIncrement = 0;

	async function toggleEditing(){
		if(!isEditing.value){
			isEditing.value = true;
			return;
		}

		member.value.system = system.value.uuid;

		if(member.value.customFields){
			member.value.customFields.forEach((v, k) => {
				if(!v.trim().length)
					member.value.customFields!.delete(k);
			});
		}

		customFieldsToShowInViewMode.value = customFields.value.filter(x => (member.value.customFields?.has(x.uuid)));

		const uuid = member.value.uuid;
		const _member = toRaw(member.value);

		_member.customFields = new Map(_member.customFields?.entries().filter(x => isValidCustomField(x[0])));

		try{
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.present();

			if(!uuid){
				const result = await newMember({
					..._member,
					dateCreated: new Date()
				});
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();

				router.back();
				return;
			}

			const result = await updateMember(_member as Member);
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

			eggIncrement = 0;
			isEditing.value = false;
		}catch(e){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

			await toast((e as Error).message);
		}
	}

	function easterEgg(){
		if(eggIncrement >= 4) {
			void savePicture();
			eggIncrement = 0;
		} else if(isEditing.value)
			eggIncrement++;
	}

	async function savePicture(){
		loadingBar.value = true;

		const memberMetadata: PartialBy<Member, "uuid" | "system" | "dateCreated"> = structuredClone(toRaw(member.value));

		delete memberMetadata.uuid;
		delete memberMetadata.system;
		if(memberMetadata.image) delete memberMetadata.image;

		try{
			const image = await encodeImageWithMetadata(member.value.image, member.value.name.length ? member.value.name : Date.now().toString(), memberMetadata);
			if(image) await saveImageFile(image);
		}catch(e){
			await toast((e as Error).message);
		}

		loadingBar.value = false;
	}

	async function modifyPicture(){
		loadingBar.value = true;
		const maybeImage = await getImageOrMetadata();

		if(!maybeImage){
			loadingBar.value = false;
			return;
		}

		const { image, metadata } = maybeImage;

		member.value.image = image;

		if(metadata && typeof (metadata as Member).name === "string") {
			// prepare metadata
			(metadata as Member).tags = (metadata as Member).tags.filter(x => isValidTag(x));

			if((metadata as Member).customFields)
				(metadata as Member).customFields = new Map((metadata as Member).customFields!.entries().filter(x => isValidCustomField(x[0])));

			// merge metadata
			Object.assign(member.value, metadata);

			// refresh custom fields as they won't immediately show
			customFieldsToShowInEditMode.value = customFields.value.filter(x => x.default || (member.value.customFields?.has(x.uuid) && member.value.customFields?.get(x.uuid)?.length));
			customFieldsToShowInViewMode.value = customFields.value.filter(x => (member.value.customFields?.has(x.uuid)));
		}

		loadingBar.value = false;
	}

	function deletePicture(){
		member.value.image = undefined;
	}

	async function modifyCover(){
		loadingBar.value = true;
		const image = await getResizedImage(1024);
		if(image) member.value.cover = image;
		loadingBar.value = false;
	}

	function deleteCover(){
		member.value.cover = undefined;
	}

	async function removeMember() {
		try{
			if(await promptOkCancel(
				i18next.t("members:edit.delete.title"),
				undefined,
				i18next.t("members:edit.delete.confirm")
			)){
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.present();

				const result = await deleteMember(member.value.uuid!);
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
		if(member.value.uuid){
			try{
				await window.navigator.clipboard.writeText(`@<m:${member.value.uuid}>`);
				await toast(i18next.t("members:edit.memberIDcopiedToClipboard"));
			}catch(_e){
				return;
			}
		}
	}

	async function updateRoute() {
		if(route.name !== "MemberEdit") return;

		loading.value = true;

		tags.value = (await Array.fromAsync(getTags("member")));
		customFields.value = (await Array.fromAsync(getCustomFields()));

		if(route.query.uuid){
			try{
				member.value = await getMember(route.query.uuid as string);
			} catch (e){
				console.error(e);
				member.value = defaultMember();
			}
		} else member.value = { ...emptyMember };

		if(!member.value.customFields)
			member.value.customFields = new Map();
		
		const _sys = await getSystem(member.value.system);
		if(_sys) system.value = _sys;

		customFieldsToShowInEditMode.value = customFields.value.filter(x => x.default || (member.value.customFields?.has(x.uuid) && member.value.customFields?.get(x.uuid)?.length));
		customFieldsToShowInViewMode.value = customFields.value.filter(x => (member.value.customFields?.has(x.uuid)));

		if(route.query.disallowEditing)
			canEdit.value = false;
		else 
			canEdit.value = true;
		

		// are we editing?
		isEditing.value = !member.value.uuid;

		// set color
		updateColors();

		loading.value = false;
	}

	function updateColors(){
		if(member.value.color){
			if(self?.vnode.el){
				addMaterialColors(rgbaToArgb(member.value.color), rgbaToArgb(member.value.color), self?.vnode.el as HTMLElement, "member-color");
				if(accessibilityConfig.tintWithColor)
					addMaterialColors(rgbaToArgb(member.value.color), rgbaToArgb(member.value.color), self?.vnode.el as HTMLElement);
			}
		} else {
			if(self?.vnode.el){
				unsetMaterialColors(self?.vnode.el as HTMLElement, "member-color");
				if(accessibilityConfig.tintWithColor)
					unsetMaterialColors(self?.vnode.el as HTMLElement);
			}
		}
	}

	async function updateFontFamily(){
		const fontTypes = [
			"application/font-woff",
			"application/octet-stream"
		];

		if (member.value.nameStyle?.family.startsWith("@")) {
			const assetIndex = getAssetsIndex().find(x => x.friendlyName === member.value.nameStyle?.family.slice(1));
			if(!assetIndex) return;
			const asset = await getAsset(assetIndex.uuid);
			if(fontTypes.includes(asset.file.type))
				appendFont(member.value.nameStyle?.family, asset.file);
		} else 
			deleteAllFonts();
	}

	watch(() => member.value.nameStyle?.family, updateFontFamily, { immediate: true });
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
				<IonTitle>{{ !isEditing ? $t("members:edit.header") : !member.uuid ? $t("members:edit.headerAdd") : $t("members:edit.headerEdit") }}</IonTitle>
				<IonProgressBar v-if="loadingBar" type="indeterminate" />
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<div class="cover-container">
				<Cover class="cover" :cover="member.cover" />
				<div v-if="isEditing" class="edit-buttons">
					<IonButton shape="round" size="small" @click="modifyCover">
						<IonIcon slot="icon-only" :icon="pencilMD" />
					</IonButton>
					<IonButton
						v-if="member.cover"
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
						:image="member.image"
						:clip-shape="member.imageClip"
						:color="member.color"
						:icon="accountCircle"
						@click="easterEgg"
					/>
					<div v-if="isEditing" class="edit-buttons">
						<IonButton shape="round" size="small" @click="modifyPicture">
							<IonIcon slot="icon-only" :icon="pencilMD" />
						</IonButton>
						<IonButton
							v-if="member.image"
							shape="round"
							color="danger"
							size="small"
							@click="deletePicture"
						>
							<IonIcon slot="icon-only" :icon="trashMD" />
						</IonButton>
					</div>
				</div>
			</div>

			<template v-if="!isEditing">
				<div class="system-tag">
					<SystemChip :system :clickable="true" />
				</div>

				<div class="member-info">
					<h3
						:style="{
							fontFamily: member.nameStyle?.family ? `'${member.nameStyle.family}'` : undefined,
							fontWeight: member.nameStyle?.weight,
							fontStyle: member.nameStyle?.italic ? 'italic' : undefined,
							'--member-color': member.color
						}"
						:class="{
							'with-font-family': !!member.nameStyle,
							'neon': member.nameStyle?.neon,
							'outline': member.nameStyle?.outline,
							'shadow': member.nameStyle?.shadow,
							'gradient': member.nameStyle?.gradient
						}"
					>
						{{ member.name }}
					</h3>
					<p>{{ member.pronouns }}{{ typeof member.age === "number" ? ` - ${$t("members:edit.ageDisplay", { count: member.age })}` : "" }}</p>
					<p>{{ member.role }}</p>
					<p v-if="member.isCustomFront">{{ $t("members:edit.customFront") }}</p>
					<p v-if="member.isArchived">{{ $t("members:edit.archived") }}</p>
				</div>

				<div v-if="tags?.length" class="member-tags">
					<TagChip
						v-for="tag in member.tags.map(x => tags.find(y => x === y.uuid)).filter((x): x is Tag => !!x && !x.isArchived).sort(sortName)"
						:key="tag.uuid"
						:tag
						:clickable="true"
					/>
				</div>

				<IonList>
					<IonItem class="member-field member-description">
						<IonLabel>
							<h3>{{ $t("members:edit.description") }}</h3>
							<Markdown :markdown="member.description || $t('members:edit.noDescription')" />
						</IonLabel>
					</IonItem>
					<template v-for="customField in customFieldsToShowInViewMode" :key="customField.uuid">
						<IonItem class="member-field">
							<IonLabel>
								<h3>{{ customField.name }}</h3>
								<Markdown :markdown="member.customFields?.get(customField.uuid)!" />
							</IonLabel>
						</IonItem>
					</template>
				</IonList>

				<IonList class="member-actions">
					<IonItem button detail :router-link="`/lists/frontHistory?q=@member:${member.uuid}`">
						<IonIcon slot="start" :icon="lists.frontHistory.icon" aria-hidden="true" />
						<IonLabel>{{ $t("members:edit.showFrontingEntries") }}</IonLabel>
					</IonItem>
					<IonItem button detail :router-link="`/lists/messageBoard?q=@member:${member.uuid}`">
						<IonIcon slot="start" :icon="lists.messageBoard.icon" aria-hidden="true" />
						<IonLabel>{{ $t("members:edit.showBoardEntries") }}</IonLabel>
					</IonItem>
					<IonItem button detail :router-link="`/lists/journal?q=@member:${member.uuid}`">
						<IonIcon slot="start" :icon="lists.journal.icon" aria-hidden="true" />
						<IonLabel>{{ $t("members:edit.showJournalEntries") }}</IonLabel>
					</IonItem>
				</IonList>
			</template>

			<template v-else>
				<IonList class="surface grid-2">
					<IonItem class="take-row">
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
						<IonInput
							:model-value="member.age"
							fill="solid"
							:label="$t('members:edit.age')"
							label-placement="floating"
							type="number"
							@update:model-value="member.age = $event.length > 0 ? parseInt($event) : undefined"
						/>
					</IonItem>
					<IonItem class="take-row">
						<IonInput
							v-model="member.role"
							fill="solid"
							:label="$t('members:edit.role')"
							label-placement="floating"
						/>
					</IonItem>
					<IonItem class="take-row">
						<IonTextarea
							v-model="member.description"
							fill="solid"
							auto-grow
							:label="$t('members:edit.description')"
							label-placement="floating"
						/>
					</IonItem>
					<IonItem
						v-for="customField in customFieldsToShowInEditMode"
						:key="customField.uuid"
						class="take-row"
					>
						<IonTextarea
							fill="solid"
							auto-grow
							:label="customField.name"
							label-placement="floating"
							:model-value="member.customFields?.get(customField.uuid)"
							@update:model-value="(v) => member.customFields?.set(customField.uuid, v)"
						/>
					</IonItem>
					<IonItem class="take-row" button @click="customFieldsSelectionModal?.$el.present()">
						<IonIcon slot="start" :icon="addMD" aria-hidden="true" />
						<IonLabel>
							{{ $t("members:edit.customFieldsAdd") }}
						</IonLabel>
					</IonItem>
				</IonList>

				<IonList class="member-edit">
					<SystemItem
						button
						detail
						:show-cover="false"
						:show-effects="false"
						:show-icons="false"
						:system
						@click="systemSelectModal?.$el.present()"
					>
						<template #before>
							<p>{{ $t("members:edit.system") }}</p>
						</template>
					</SystemItem>
					<IonItem button :detail="true" @click="tagSelectionModal?.$el.present()">
						<IonLabel>
							{{ $t("members:edit.tags") }}
							<div v-if="tags?.length" class="member-tags">
								<TagChip
									v-for="tag in member.tags.map(x => tags.find(y => y.uuid === x)).filter(x => !!x).sort(sortName)"
									:key="tag.uuid"
									:tag
								/>
							</div>
						</IonLabel>
					</IonItem>
					<IonItem button :detail="false">
						<Color v-model="member.color" @update:model-value="updateColors">
							<IonLabel>
								{{ $t("members:edit.color") }}
							</IonLabel>
						</Color>
						<IonButton
							v-if="member.color"
							slot="end"
							shape="round"
							fill="outline"
							size="small"
							@click="(e) => { e.stopPropagation(); member.color = undefined; updateColors() }"
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
						@click="fontFamilyPicker($t('members:edit.nameStyle')).then(res => {
							if(typeof res === 'undefined') return;
							if(res !== null){
								member.nameStyle = {
									family: res,
									italic: member.nameStyle?.italic || false,
									weight: member.nameStyle?.weight || 400,
									neon: member.nameStyle?.neon || false,
									outline: member.nameStyle?.outline || false,
									shadow: member.nameStyle?.shadow || false,
									gradient: member.nameStyle?.gradient || false
								};
							} else
								member.nameStyle = undefined;
						})"
					>
						<IonLabel>
							<h3>{{ $t("members:edit.nameStyle") }}</h3>
							<p>{{ member.nameStyle?.family || $t("other:fonts.noFont") }}</p>
						</IonLabel>
					</IonItem>
					<IonItem v-if="member.nameStyle">
						<div class="name-style-buttons">
							<IonButton
								:aria-label="$t('other:fontStyles.bold')"
								shape="round"
								:fill="member.nameStyle.weight > 400 ? 'solid' : 'outline'"
								size="small"
								@click="(e) => {
									e.stopPropagation();
									member.nameStyle!.weight = member.nameStyle!.weight > 400 ? 400 : 700;
								}"
							>
								<IonIcon
									slot="icon-only"
									:icon="boldMD"
								/>
							</IonButton>
							<IonButton
								:aria-label="$t('other:fontStyles.italic')"
								class="last-button"
								shape="round"
								:fill="member.nameStyle.italic ? 'solid' : 'outline'"
								size="small"
								@click="(e) => {
									e.stopPropagation();
									member.nameStyle!.italic = !member.nameStyle?.italic;
								}"
							>
								<IonIcon
									slot="icon-only"
									:icon="italicMD"
								/>
							</IonButton>
							<IonButton
								:aria-label="$t('other:fontStyles.outline')"
								shape="round"
								:fill="member.nameStyle.outline ? 'solid' : 'outline'"
								size="small"
								@click="(e) => {
									e.stopPropagation();
									member.nameStyle!.outline = !member.nameStyle?.outline;
									if(member.nameStyle?.outline)
										member.nameStyle.gradient = false;
								}"
							>
								<IonIcon
									slot="icon-only"
									:icon="outlineMD"
								/>
							</IonButton>

							<IonButton
								:aria-label="$t('other:fontStyles.gradient')"
								class="last-button"
								shape="round"
								:fill="member.nameStyle.gradient ? 'solid' : 'outline'"
								size="small"
								@click="(e) => {
									e.stopPropagation();
									member.nameStyle!.gradient = !member.nameStyle?.gradient;
									if(member.nameStyle?.gradient){
										member.nameStyle.outline = false;
									}
								}"
							>
								<IonIcon
									slot="icon-only"
									:icon="gradientMD"
								/>
							</IonButton>

							<IonButton
								:aria-label="$t('other:fontStyles.neon')"
								shape="round"
								:fill="member.nameStyle.neon ? 'solid' : 'outline'"
								size="small"
								@click="(e) => {
									e.stopPropagation();
									member.nameStyle!.neon = !member.nameStyle?.neon;
									if(member.nameStyle?.neon){
										member.nameStyle.shadow = false;
									}
								}"
							>
								<IonIcon
									slot="icon-only"
									:icon="neonMD"
								/>
							</IonButton>
							<IonButton
								:aria-label="$t('other:fontStyles.shadow')"
								class="last-button"
								shape="round"
								:fill="member.nameStyle.shadow ? 'solid' : 'outline'"
								size="small"
								@click="(e) => {
									e.stopPropagation();
									member.nameStyle!.shadow = !member.nameStyle?.shadow;
									if(member.nameStyle?.shadow){
										member.nameStyle.neon = false;
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
					<IonItem button detail @click="imageClipPicker($t('members:edit.imageClip')).then(res => { if(res !== undefined) member.imageClip = res ?? undefined; })">
						<IonLabel>
							<h3>{{ $t("members:edit.imageClip") }}</h3>
							<p>{{ member.imageClip ? $t(`other:shapes.${member.imageClip}`) : $t("other:shapes.noShape") }}</p>
						</IonLabel>
					</IonItem>
					<IonItem button :detail="false">
						<IonToggle v-model="member.isPinned">
							<IonLabel>
								{{ $t("members:edit.isPinned") }}
							</IonLabel>
						</IonToggle>
					</IonItem>
					<IonItem button :detail="false">
						<IonToggle v-model="member.isCustomFront">
							<IonLabel>
								{{ $t("members:edit.customFront") }}
							</IonLabel>
						</IonToggle>
					</IonItem>
					<IonItem button :detail="false">
						<IonToggle v-model="member.isArchived">
							<IonLabel>
								{{ $t("members:edit.archived") }}
							</IonLabel>
						</IonToggle>
					</IonItem>
					<IonItem
						v-if="member.uuid"
						button
						:detail="false"
						@click="removeMember"
					>
						<IonIcon
							slot="start"
							:icon="trashMD"
							aria-hidden="true"
							color="danger"
						/>
						<IonLabel color="danger">
							<h3>{{ $t("members:edit.delete.title") }}</h3>
							<p>{{ $t("other:genericDeleteDesc") }}</p>
						</IonLabel>
					</IonItem>

					<IonItem
						v-if="member.uuid"
						:detail="false"
						button
						@click="copyIdToClipboard"
					>
						<IonLabel>
							<p>{{ $t("members:edit.memberID", { memberID: member.uuid }) }}</p>
						</IonLabel>
					</IonItem>
					<IonItem v-if="member.dateCreated" :detail="false">
						<IonLabel>
							<p>
								{{ $t("members:edit.dateCreated", { dateCreated: formatDate(member.dateCreated, "expanded") }) }}
							</p>
						</IonLabel>
					</IonItem>
				</IonList>
			</template>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="canEdit" :disabled="isEditing && !member.name.length" @click="toggleEditing">
					<IonIcon :icon="isEditing ? saveMD : pencilMD" />
				</IonFabButton>
			</IonFab>

			<CustomFieldsSelect
				ref="customFieldsSelectionModal"
				:model-value="customFieldsToShowInEditMode"
				@update:model-value="_customFields => {
					customFieldsToShowInEditMode = customFields.filter(x => {
						return x.default || _customFields.map(y => y.uuid).includes(x.uuid)
					});
				}"
			/>

			<TagListSelect
				ref="tagSelectionModal"
				type="member"
				:model-value="member.tags.map(uuid => tags.find(x => x.uuid === uuid)).filter(x => !!x)"
				@update:model-value="tags => { member.tags = tags.map(x => x.uuid) }"
			/>

			<SystemSelect
				ref="systemSelectModal"
				:model-value="[system]"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="false"
				@update:model-value="e => { if(e[0]) system = e[0] }"
			/>

			<Loading ref="loadingModal" />
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

	div.member-tags {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		padding: 0 16px;
	}

	div.system-tag {
		display: flex;
		flex-direction: row;
		justify-content: center;
		padding: 0 16px;
	}

	.member-edit div.member-tags {
		padding: 8px 0 0 0;
		justify-content: start;
	}

	div.member-info {
		display: block;
		margin: auto;
		text-align: center;
		position: relative;
		z-index: 0;

		* {
			position: relative;
			margin: 0.20em;
			z-index: 1;
		}

		h3 {
			z-index: -1;
			line-height: normal;

			&:not(.with-font-family) {
				font-family: var(--ampersand-header-font-name), var(--ion-font-family);
				font-style: var(--ampersand-header-font-style);
				font-weight: var(--ampersand-header-font-weight);
				font-feature-settings: var(--ampersand-header-font-features);
				font-variation-settings: var(--ampersand-header-font-variation);
			}

			&.with-font-family {
				&.outline {
					-webkit-text-stroke: 0.3rem rgb(var(--member-color-light-primary-container, var(--md3-light-primary-container)));
					paint-order: stroke fill markers;

					&:is(html.ion-palette-dark *) {
						-webkit-text-stroke: 0.3rem rgb(var(--member-color-dark-primary-container, var(--md3-dark-primary-container)));
					}
				}

				&.neon {
					color: white;
					text-shadow:
						0px 0px 1px currentColor,
						0px 0px 2px currentColor,
						0px 0px 4px currentColor;
					filter:
						drop-shadow(0px 0px 8px var(--member-color, rgb(var(--member-color-light-primary, var(--md3-light-primary)))))
						drop-shadow(0px 0px 32px var(--member-color, rgb(var(--member-color-light-primary, var(--md3-light-primary)))));

					&:is(html.ion-palette-dark *){
						filter:
							drop-shadow(0px 0px 8px var(--member-color, rgb(var(--member-color-dark-primary, var(--md3-dark-primary)))))
							drop-shadow(0px 0px 32px var(--member-color, rgb(var(--member-color-dark-primary, var(--md3-dark-primary)))));
					}

					&.outline {
						-webkit-text-stroke: 0.3rem var(--member-color, rgb(var(--member-color-light-primary, var(--md3-light-primary))));

						&:is(html.ion-palette-dark *){
							-webkit-text-stroke: 0.3rem var(--member-color, rgb(var(--member-color-dark-primary, var(--md3-dark-primary))));
						}
					}

					&.gradient {
						background-image: linear-gradient(to top, rgb(var(--member-color-light-primary-container, var(--md3-light-primary-container))) 0%, rgb(var(--member-color-dark-on-surface, var(--md3-dark-on-surface))) 100%);
						background-clip: text;
						color: transparent;

						&:is(html.ion-palette-dark *) {
							background-image: linear-gradient(to top, rgb(var(--member-color-dark-primary-container, var(--md3-dark-primary-container))) 0%, rgb(var(--member-color-dark-on-surface, var(--md3-dark-on-surface))) 100%);
							background-clip: text;
							color: transparent;
						}
					}
				}

				&.shadow {
					filter:
						drop-shadow(0.5px 0.5px rgb(var(--member-color-light-primary, var(--md3-light-primary))))
						drop-shadow(1px 1px rgb(var(--member-color-light-primary, var(--md3-light-primary))))
						drop-shadow(1.5px 1.5px rgb(var(--member-color-light-primary, var(--md3-light-primary))))
						drop-shadow(2px 2px rgb(var(--member-color-light-primary, var(--md3-light-primary))))
						drop-shadow(2.5px 2.5px rgb(var(--member-color-light-primary, var(--md3-light-primary))));

					&:is(html.ion-palette-dark *){
						filter:
							drop-shadow(0.5px 0.5px rgb(var(--member-color-dark-primary-container, var(--md3-dark-primary-container))))
							drop-shadow(1px 1px rgb(var(--member-color-dark-primary-container, var(--md3-dark-primary-container))))
							drop-shadow(1.5px 1.5px rgb(var(--member-color-dark-primary-container, var(--md3-dark-primary-container))))
							drop-shadow(2px 2px rgb(var(--member-color-dark-primary-container, var(--md3-dark-primary-container))))
							drop-shadow(2.5px 2.5px rgb(var(--member-color-dark-primary-container, var(--md3-dark-primary-container))));
					}
				}

				&.gradient {
					background-image: linear-gradient(to top, rgb(var(--member-color-light-primary-container, var(--md3-light-primary-container))) 0%, rgb(var(--member-color-light-on-surface, var(--md3-light-on-surface))) 100%);
					background-clip: text;
					color: transparent;

					&:is(html.ion-palette-dark *){
						background-image: linear-gradient(to top, rgb(var(--member-color-dark-primary-container, var(--md3-dark-primary-container))) 0%, rgb(var(--member-color-dark-on-surface, var(--md3-dark-on-surface))) 100%);
					}
				}
			}
		}
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

	.member-field ion-label {
		margin: 0;
	}

	.grid-2 {
		display: grid;
		grid-template-columns: 2fr 1fr;
	}

	.take-row {
		grid-column: 1 / span 2;
	}

	.grid-2 ion-item::part(native) {
		height: 100%;
	}
</style>