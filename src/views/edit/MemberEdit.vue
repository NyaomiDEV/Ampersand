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
		IonAvatar,
		IonPage,
	} from "@ionic/vue";
	import Color from "../../components/Color.vue";
	import TagChip from "../../components/tag/TagChip.vue";

	import TagListSelect from "../../modals/TagListSelect.vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg";
	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import newspaperMD from "@material-symbols/svg-600/outlined/newspaper.svg";
	import journalMD from "@material-symbols/svg-600/outlined/book.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import FrontHistoryMD from "@material-symbols/svg-600/outlined/show_chart.svg";
	import systemCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";

	import { CustomField, Member, System, Tag, UUID } from "../../lib/db/entities";
	import { newMember, deleteMember, updateMember, defaultMember, getMember } from "../../lib/db/tables/members";
	import { getFiles, promptOkCancel, toast } from "../../lib/util/misc";
	import { resizeImage } from "../../lib/util/image";
	import { getCurrentInstance, onBeforeMount, ref, shallowRef, toRaw, useTemplateRef, watch } from "vue";
	import Markdown from "../../components/Markdown.vue";
	import { addMaterialColors, rgbaToArgb, unsetMaterialColors } from "../../lib/theme";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import { useTranslation } from "i18next-vue";
	import { formatDate } from "../../lib/util/misc";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import MemberAvatar from "../../components/member/MemberAvatar.vue";
	import MemberCover from "../../components/member/MemberCover.vue";
	import SystemSelect from "../../modals/SystemSelect.vue";
	import { getCustomFields } from "../../lib/db/tables/customFields";
	import CustomFieldsSelect from "../../modals/CustomFieldsSelect.vue";
	import { appConfig } from "../../lib/config";
	import { deleteMemberTag, getMemberTagsForMember, newMemberTag } from "../../lib/db/tables/memberTags";
	import { deleteCustomFieldDatum, getCustomFieldDataForMember, newCustomFieldDatum, updateCustomFieldDatum } from "../../lib/db/tables/customFieldData";
	import { deleteFile, newFile, updateFile } from "../../lib/db/tables/files";
	import { getSystem } from "../../lib/db/tables/system";
	import { getObjectURL } from "../../lib/util/blob";
	import SystemChip from "../../components/SystemChip.vue";

	const i18next = useTranslation();

	const router = useIonRouter();
	const route = useRoute();

	const loading = ref(false);

	const emptyMember: PartialBy<Member, "id" | "dateCreated"> = {
		name: "",
		system: { // TODO: Make it more elegant and make sure it won't break
			id: appConfig.defaultSystem,
			name: ""
		},
		isArchived: false,
		isCustomFront: false,
		isPinned: false
	};
	const member = ref({ ...emptyMember });

	const system = ref<System>({ id: member.value.system.id, name: "" });
	const systemImageURL = ref<string>();
	const tags = shallowRef<Tag[]>([]);
	const tagSelectionModal = useTemplateRef("tagSelectionModal");
	const systemSelectModal = useTemplateRef("systemSelectModal");

	const customFields = shallowRef<Map<CustomField, string>>(new Map());

	const customFieldsToShowInEditMode = shallowRef<CustomField[]>([]);
	const customFieldsToShowInViewMode = shallowRef<CustomField[]>([]);
	const customFieldsSelectionModal = useTemplateRef("customFieldsSelectionModal");

	const canEdit = ref(true);
	const isEditing = ref(false);
	const self = getCurrentInstance();

	async function toggleEditing(){
		if(!isEditing.value){
			isEditing.value = true;
			return;
		}

		member.value.system.id = system.value.id;

		let id = member.value.id;
		const _member = toRaw(member.value);
		let isNew = false;

		if(!id){
			isNew = true;
			id = (await newMember({
				..._member,
				dateCreated: new Date()
			}))?.id;
		} else
			await updateMember(id, _member);

		if(id){
			let _tags = toRaw(tags.value);
			const allMemberTags = await Array.fromAsync(getMemberTagsForMember({ ..._member, id } as Member));
			for(const memberTag of allMemberTags){
				const tag = _tags.find(x => x.id === memberTag.tag.id);
				if(!tag)
					await deleteMemberTag(memberTag.id);
				else _tags = _tags.filter(x => x !== tag);
			}
			for(const remainingTag of _tags){
				await newMemberTag({
					tag: remainingTag,
					member: { ..._member, id } as Member
				});
			}

			let _customFields = Array.from(toRaw(customFields.value).entries());
			const customFieldData = await Array.fromAsync(getCustomFieldDataForMember({ ..._member, id } as Member));
			for(const customFieldDatum of customFieldData){
				const field = _customFields.find(x => x[0].id === customFieldDatum.field.id);
				if(!field || !field[1].length)
					await deleteCustomFieldDatum(customFieldDatum.id);
				else {
					await updateCustomFieldDatum(customFieldDatum.id, {
						value: field[1]
					});
					_customFields = _customFields.filter(x => x !== field);
				}
			}

			for(const remainingField of _customFields){
				if(remainingField[1].length){
					await newCustomFieldDatum({
						value: remainingField[1],
						member: { ..._member, id } as Member,
						field: remainingField[0]
					});
				}
			}
		}

		if(isNew){
			router.back();
			return;
		}

		isEditing.value = false;
	}

	async function modifyPicture(){
		const files = await getFiles();
		if(files.length){
			let _file: File;
			if(files[0].type === "image/gif")
				_file = files[0];
			else
				_file = await resizeImage(files[0]);

			if(member.value.image)
				await updateFile(member.value.image.id, undefined, _file.stream());
			else 
				member.value.image = await newFile(_file.name, _file.stream());
		}
	}

	async function deletePicture(){
		if(member.value.image){
			await deleteFile(member.value.image.id);
			member.value.image = undefined;
		}
	}

	async function modifyCover(){
		const files = await getFiles();
		if(files.length){
			let _file: File;
			if(files[0].type === "image/gif")
				_file = files[0];
			else
				_file = await resizeImage(files[0], 1024);

			if(member.value.cover)
				await updateFile(member.value.cover.id, undefined, _file.stream());
			else 
				member.value.cover = await newFile(_file.name, _file.stream());
		}
	}

	async function deleteCover(){
		if(member.value.cover){
			await deleteFile(member.value.cover.id);
			member.value.cover = undefined;
		}
	}

	async function removeMember() {
		if(await promptOkCancel(
			i18next.t("members:edit.delete.title"),
			i18next.t("members:edit.delete.confirm")
		)){
			await deleteMember(member.value.id!);
			router.back();
		}
	}

	async function copyIdToClipboard(){
		if(member.value.id){
			try{
				await window.navigator.clipboard.writeText(`@<m:${member.value.id}>`);
				await toast(i18next.t("members:edit.memberIDcopiedToClipboard"));
			}catch(_e){
				return;
			}
		}
	}

	async function updateRoute() {
		if(route.name !== "MemberEdit") return;

		loading.value = true;

		const allCustomFields = (await Array.fromAsync(getCustomFields())).sort((a, b) => a.priority - b.priority);

		if(route.query.uuid){
			const _member = await getMember(route.query.uuid as UUID);
			if(_member) member.value = _member;
			else member.value = defaultMember();
		} else member.value = { ...emptyMember };

		customFieldsToShowInEditMode.value = allCustomFields.filter(x => x.default);

		// TODO: Check if system is joined correctly and avoid this call
		const _sys = await getSystem(member.value.system.id);
		if(_sys) system.value = _sys;
		if(system.value.image) systemImageURL.value = await getObjectURL(system.value.image);

		if(member.value.id){
			tags.value = (await Array.fromAsync(getMemberTagsForMember(member.value as Member)))
				.map(x => x.tag as Tag)
				.sort((a, b) => a.name.localeCompare(b.name));

			const customFieldData = (await Array.fromAsync(getCustomFieldDataForMember(member.value as Member)));
			for(const datum of customFieldData)
				customFields.value.set(datum.field as CustomField, datum.value);

			customFieldsToShowInViewMode.value = customFieldData.filter(x => x.value.length).map(x => x.field as CustomField);
			customFieldsToShowInEditMode.value = allCustomFields.filter(x => x.default || customFieldData.find(y => y.field.id === x.id)?.value.length);
		}

		if(route.query.disallowEditing)
			canEdit.value = false;
		else 
			canEdit.value = true;
		

		// are we editing?
		isEditing.value = !member.value.id;

		// set color
		updateColors();

		loading.value = false;
	}

	function updateColors(){
		if(member.value.color){
			if(self?.vnode.el) addMaterialColors(rgbaToArgb(member.value.color), self?.vnode.el as HTMLElement);
		} else 
			if(self?.vnode.el) unsetMaterialColors(self?.vnode.el as HTMLElement);
		
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
					default-href="/members/"
				/>
				<IonTitle>{{ !isEditing ? $t("members:edit.header") : !member.id ? $t("members:edit.headerAdd") : $t("members:edit.headerEdit") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<div class="cover-container">
				<MemberCover class="cover" :member="member as Member" />
				<div v-if="isEditing" class="edit-buttons">
					<IonButton shape="round" @click="modifyCover">
						<IonIcon slot="icon-only" :icon="pencilMD" />
					</IonButton>
					<IonButton
						v-if="member.cover"
						shape="round"
						color="danger"
						@click="deleteCover"
					>
						<IonIcon slot="icon-only" :icon="trashMD" />
					</IonButton>
				</div>

				<div class="avatar-container">
					<MemberAvatar :member="member as Member" />
					<div v-if="isEditing" class="edit-buttons">
						<IonButton shape="round" @click="modifyPicture">
							<IonIcon slot="icon-only" :icon="pencilMD" />
						</IonButton>
						<IonButton
							v-if="member.image"
							shape="round"
							color="danger"
							@click="deletePicture"
						>
							<IonIcon slot="icon-only" :icon="trashMD" />
						</IonButton>
					</div>
				</div>
			</div>

			<div v-if="!isEditing" class="system-tag">
				<SystemChip :system />
			</div>

			<div v-if="!isEditing" class="member-info">
				<h1>{{ member.name }}</h1>
				<p>{{ member.pronouns }}</p>
				<p>{{ member.role }}</p>
				<p v-if="member.isCustomFront">{{ $t("members:edit.customFront") }}</p>
				<p v-if="member.isArchived">{{ $t("members:edit.archived") }}</p>
			</div>

			<div v-if="!isEditing && tags?.length" class="member-tags">
				<TagChip
					v-for="tag in tags"
					:key="tag.id"
					:tag
				/>
			</div>

			<div v-if="!isEditing" class="member-description">
				<IonLabel>{{ $t("members:edit.description") }}</IonLabel>
				<Markdown :markdown="member.description || $t('members:edit.noDescription')" />
			</div>

			<template v-for="customField in customFieldsToShowInViewMode" :key="customField.id">
				<div
					v-if="!isEditing"
					class="member-custom-field"
				>
					<IonLabel>{{ customField.name }}</IonLabel>
					<Markdown :markdown="customFields.get(customField) || ''" />
				</div>
			</template>


			<IonList v-if="!isEditing" class="member-actions">
				<IonItem button detail :router-link="`/options/frontHistory?q=@member:${member.id}`">
					<IonIcon slot="start" :icon="FrontHistoryMD" aria-hidden="true" />
					<IonLabel>{{ $t("members:edit.showFrontingEntries") }}</IonLabel>
				</IonItem>
				<IonItem button detail :router-link="`/options/messageBoard?q=@member:${member.id}`">
					<IonIcon slot="start" :icon="newspaperMD" aria-hidden="true" />
					<IonLabel>{{ $t("members:edit.showBoardEntries") }}</IonLabel>
				</IonItem>
				<IonItem button detail :router-link="`/journal?q=@member:${member.id}`">
					<IonIcon slot="start" :icon="journalMD" aria-hidden="true" />
					<IonLabel>{{ $t("members:edit.showJournalEntries") }}</IonLabel>
				</IonItem>
			</IonList>

			<IonList v-if="isEditing" class="member-edit" inset>
				<IonItem>
					<IonInput
						v-model="member.name"
						fill="outline"
						:label="$t('members:edit.name')"
						label-placement="floating"
					/>
				</IonItem>
				<IonItem>
					<IonInput
						v-model="member.pronouns"
						fill="outline"
						:label="$t('members:edit.pronouns')"
						label-placement="floating"
					/>
				</IonItem>
				<IonItem>
					<IonInput
						v-model="member.role"
						fill="outline"
						:label="$t('members:edit.role')"
						label-placement="floating"
					/>
				</IonItem>
				<IonItem>
					<IonTextarea
						v-model="member.description"
						fill="outline"
						auto-grow
						:label="$t('members:edit.description')"
						label-placement="floating"
					/>
				</IonItem>
				<IonItem
					v-for="customField in customFieldsToShowInEditMode"
					:key="customField.id"
				>
					<IonTextarea
						fill="outline"
						auto-grow
						:label="customField.name"
						label-placement="floating"
						:model-value="customFields.get(customField)"
						@update:model-value="(v) => customFields.set(customField, v)"
					/>
				</IonItem>
				<IonItem button @click="customFieldsSelectionModal?.$el.present()">
					<IonIcon slot="start" :icon="addMD" aria-hidden="true" />
					<IonLabel>
						{{ $t("members:edit.customFieldsAdd") }}
					</IonLabel>
				</IonItem>
				<IonItem button :detail="true" @click="systemSelectModal?.$el.present()">
					<IonAvatar slot="start">
						<img v-if="system.image" aria-hidden="true" :src="systemImageURL" />
						<IonIcon v-else :icon="systemCircle" />
					</IonAvatar>
					<IonLabel>
						<p>{{ $t("members:edit.system") }}</p>
						<h2>{{ system.name }}</h2>
					</IonLabel>
				</IonItem>
				<IonItem button :detail="true" @click="tagSelectionModal?.$el.present()">
					<IonLabel>
						{{ $t("members:edit.tags") }}
						<div v-if="tags?.length" class="member-tags">
							<TagChip
								v-for="tag in tags"
								:key="tag.id"
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
						size="default"
						@click="(e) => { e.stopPropagation(); member.color = undefined; updateColors() }"
					>
						<IonIcon
							slot="icon-only"
							:icon="trashMD"
							color="danger"
						/>
					</IonButton>
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
					v-if="member.id"
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
					v-if="member.id"
					:detail="false"
					button
					@click="copyIdToClipboard"
				>
					<IonLabel>
						<p>{{ $t("members:edit.memberID", { memberID: member.id }) }}</p>
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

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="canEdit" :disabled="isEditing && !member.name.length" @click="toggleEditing">
					<IonIcon :icon="isEditing ? saveMD : pencilMD" />
				</IonFabButton>
			</IonFab>

			<CustomFieldsSelect
				ref="customFieldsSelectionModal"
				:model-value="customFieldsToShowInEditMode"
				@update:model-value="async _customFields => {
					customFieldsToShowInEditMode = (await Array.fromAsync(getCustomFields())).filter(x => {
						return x.default || _customFields.map(y => y.id).includes(x.id)
					});
				}"
			/>

			<TagListSelect
				ref="tagSelectionModal"
				:type="0"
				:model-value="tags"
			/>

			<SystemSelect
				ref="systemSelectModal"
				v-model="system"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="false"
			/>
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
	}

	div.avatar-container > div.edit-buttons {
		position: absolute;
		bottom: 8px;
		width: 100%;
		display: flex;
		justify-content: space-between;
		flex-direction: row-reverse;
	}

	div.avatar-container ion-avatar {
		width: 192px;
		height: 192px;
		outline-width: 8px !important;
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

	.member-edit ion-avatar ion-icon {
		width: 100%;
		height: 100%;
		color: var(--ion-color-primary);
	}

	div.member-info {
		display: block;
		margin: auto;
		text-align: center;
	}

	div.member-info * {
		margin: 0;
	}

	div.member-description, div.member-custom-field {
		padding: 16px calc(16px + var(--ion-safe-area-right, 0px)) 0px calc(16px + var(--ion-safe-area-left, 0px));
	}

	div.member-description ion-label,
	div.member-custom-field ion-label {
		color: var(--ion-color-step-600, var(--ion-text-color-step-400, #666666));
	}
</style>