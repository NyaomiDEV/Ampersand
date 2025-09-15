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
		toastController,
		alertController
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

	import { CustomField, Member, Tag } from "../../lib/db/entities";
	import { newMember, deleteMember, updateMember, defaultMember, getMember } from "../../lib/db/tables/members";
	import { getTags } from "../../lib/db/tables/tags";
	import { getFiles } from "../../lib/util/misc";
	import { resizeImage } from "../../lib/util/image";
	import { getCurrentInstance, inject, onBeforeMount, ref, shallowRef, toRaw, useTemplateRef, watch } from "vue";
	import Markdown from "../../components/Markdown.vue";
	import { addMaterialColors, rgbaToArgb, unsetMaterialColors } from "../../lib/theme";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import { useTranslation } from "i18next-vue";
	import { formatDate } from "../../lib/util/misc";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import MemberAvatar from "../../components/member/MemberAvatar.vue";
	import MemberCover from "../../components/member/MemberCover.vue";
	import { getCustomFields } from "../../lib/db/tables/customFields";
	import CustomFieldsSelect from "../../modals/CustomFieldsSelect.vue";

	const i18next = useTranslation();

	const isIOS = inject<boolean>("isIOS")!;

	const router = useIonRouter();
	const route = useRoute();

	const loading = ref(false);

	const emptyMember: PartialBy<Member, "uuid" | "dateCreated"> = {
		name: "",
		isArchived: false,
		isCustomFront: false,
		tags: []
	};
	const member = ref({...emptyMember});

	const tags = shallowRef<Tag[]>([]);
	const tagSelectionModal = useTemplateRef("tagSelectionModal");

	const customFields = shallowRef<CustomField[]>([]);
	const customFieldsToShow = shallowRef<CustomField[]>([]);
	const customFieldsSelectionModal = useTemplateRef("customFieldsSelectionModal");

	const canEdit = ref(true);
	const isEditing = ref(false);
	const self = getCurrentInstance();

	async function toggleEditing(){
		if(!isEditing.value){
			isEditing.value = true;
			return;
		}

		if(member.value.customFields){
			member.value.customFields.forEach((v, k) => {
				if(!v.length)
					member.value.customFields!.delete(k);
			});
		}

		const uuid = member.value.uuid;
		const _member = toRaw(member.value);

		if(!uuid){
			await newMember({
				..._member,
				dateCreated: new Date()
			});
			router.back();

			return;
		}

		await updateMember(uuid, _member);

		isEditing.value = false;
	}

	async function modifyPicture(){
		const files = await getFiles();
		if(files.length){
			if(files[0].type === "image/gif"){
				member.value.image = files[0];
				return;
			}
			member.value.image = await resizeImage(files[0]);
		}
	}

	function deletePicture(){
		delete member.value.image;
	}

	async function modifyCover(){
		const files = await getFiles();
		if(files.length){
			if(files[0].type === "image/gif"){
				member.value.cover = files[0];
				return;
			}
			member.value.cover = await resizeImage(files[0], 1024);
		}
	}

	function deleteCover(){
		delete member.value.cover;
	}

	function promptDeletion(): Promise<boolean> {
		return new Promise((resolve) => {
			void (async () => {
				const alert = await alertController.create({
					header: i18next.t("members:edit.delete.title"),
					subHeader: i18next.t("members:edit.delete.confirm"),
					buttons: [
						{
							text: i18next.t("other:alerts.cancel"),
							role: "cancel",
							handler: () => resolve(false)
						},
						{
							text: i18next.t("other:alerts.ok"),
							role: "confirm",
							handler: () => resolve(true)
						}
					]
				});

				await alert.present();
			})();
		});
	}

	async function removeMember() {
		if(await promptDeletion()){
			await deleteMember(member.value.uuid!);
			router.back();
		}
	}

	async function copyIdToClipboard(){
		if(member.value.uuid){
			try{
				await window.navigator.clipboard.writeText("@<m:" + member.value.uuid + ">");

				const toast = await toastController.create({
					message: i18next.t("members:edit.memberIDcopiedToClipboard"),
					duration: 1500,
					position: "bottom",
				});

				await toast.present();
			}catch(_e){
				return;
			}
		}
	}

	async function updateRoute() {
		if(route.name !== "MemberEdit") return;

		loading.value = true;

		tags.value = (await Array.fromAsync(getTags())).filter(x => x.type === "member");
		customFields.value = await Array.fromAsync(getCustomFields());

		if(route.query.uuid){
			const _member = await getMember(route.query.uuid as string);
			if(_member) member.value = _member;
			else member.value = defaultMember();
		} else member.value = {...emptyMember};

		if(!member.value.customFields)
			member.value.customFields = new Map();
		

		customFieldsToShow.value = customFields.value.filter(x => x.default || (member.value.customFields?.has(x.uuid) && member.value.customFields?.get(x.uuid)?.length));

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
					:text="isIOS ? $t('other:back') : undefined"
					:icon="!isIOS ? backMD : undefined"
					default-href="/members/"
				/>
				<IonTitle>{{ !isEditing ? $t("members:edit.header") : !member.uuid ? $t("members:edit.headerAdd") : $t("members:edit.headerEdit") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<div class="cover-container">
				<MemberCover class="cover" :member />
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
					<MemberAvatar :member />
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

			<div v-if="!isEditing" class="member-info">
				<h1>{{ member.name }}</h1>
				<p>{{ member.pronouns }}</p>
				<p>{{ member.role }}</p>
				<p v-if="member.isCustomFront">{{ $t("members:edit.customFront") }}</p>
				<p v-if="member.isArchived">{{ $t("members:edit.archived") }}</p>
			</div>

			<div v-if="!isEditing && tags?.length" class="member-tags">
				<TagChip
					v-for="tag in member.tags"
					:key="tag"
					:tag="tags.find(x => x.uuid === tag)!"
				/>
			</div>

			<div v-if="!isEditing" class="member-description">
				<IonLabel>{{ $t("members:edit.description") }}</IonLabel>
				<Markdown :markdown="member.description || $t('members:edit.noDescription')" />
			</div>

			<template v-for="customField in customFields.sort((a, b) => a.name.localeCompare(b.name)).filter(x => Array.from(member.customFields!.keys()).includes(x.uuid))" :key="customField.uuid">
				<div
					v-if="!isEditing"
					class="member-custom-field"
				>
					<IonLabel>{{ customField.name }}</IonLabel>
					<Markdown :markdown="member.customFields?.get(customField.uuid)!" />
				</div>
			</template>


			<IonList v-if="!isEditing" class="member-actions">
				<IonItem button detail :router-link="`/options/frontHistory?q=@member:${member.uuid}`">
					<IonIcon slot="start" :icon="FrontHistoryMD" aria-hidden="true" />
					<IonLabel>{{ $t("members:edit.showFrontingEntries") }}</IonLabel>
				</IonItem>
				<IonItem button detail :router-link="`/options/messageBoard?q=@member:${member.uuid}`">
					<IonIcon slot="start" :icon="newspaperMD" aria-hidden="true" />
					<IonLabel>{{ $t("members:edit.showBoardEntries") }}</IonLabel>
				</IonItem>
				<IonItem button detail :router-link="`/journal?q=@member:${member.uuid}`">
					<IonIcon slot="start" :icon="journalMD" aria-hidden="true" />
					<IonLabel>{{ $t("members:edit.showJournalEntries") }}</IonLabel>
				</IonItem>
			</IonList>

			<IonList v-if="isEditing" class="member-edit" inset>
				<IonItem>
					<IonInput
						v-model="member.name"
						:fill="!isIOS ? 'outline' : undefined"
						:label="$t('members:edit.name')"
						label-placement="floating"
					/>
				</IonItem>
				<IonItem>
					<IonInput
						v-model="member.pronouns"
						:fill="!isIOS ? 'outline' : undefined"
						:label="$t('members:edit.pronouns')"
						label-placement="floating"
					/>
				</IonItem>
				<IonItem>
					<IonInput
						v-model="member.role"
						:fill="!isIOS ? 'outline' : undefined"
						:label="$t('members:edit.role')"
						label-placement="floating"
					/>
				</IonItem>
				<IonItem>
					<IonTextarea
						v-model="member.description"
						:fill="!isIOS ? 'outline' : undefined"
						auto-grow
						:label="$t('members:edit.description')"
						label-placement="floating"
					/>
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

				<IonItem
					v-for="customField in customFieldsToShow.sort((a, b) => a.name.localeCompare(b.name))"
					:key="customField.uuid"
				>
					<IonTextarea
						:fill="!isIOS ? 'outline' : undefined"
						auto-grow
						:label="customField.name"
						label-placement="floating"
						:model-value="member.customFields?.get(customField.uuid)"
						@update:model-value="(v) => member.customFields?.set(customField.uuid, v)"
					/>
				</IonItem>

				<IonItem button @click="customFieldsSelectionModal?.$el.present()">
					<IonIcon slot="start" :icon="addMD" aria-hidden="true" />
					<IonLabel>
						{{ $t("members:edit.customFieldsAdd") }}
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

				<IonItem button @click="tagSelectionModal?.$el.present()">
					<IonLabel>
						{{ $t("members:edit.tags") }}
						<div v-if="tags?.length" class="member-tags">
							<TagChip
								v-for="tag in member.tags"
								:key="tag"
								:tag="tags.find(x => x.uuid === tag)!"
							/>
						</div>
					</IonLabel>
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
							{{ $t("members:edit.dateCreated", { dateCreated: formatDate(member.dateCreated, "expanded")
							}) }}
						</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="member.name.length > 0 && canEdit" @click="toggleEditing">
					<IonIcon :icon="isEditing ? saveMD : pencilMD" />
				</IonFabButton>
			</IonFab>

			<CustomFieldsSelect
				ref="customFieldsSelectionModal"
				:model-value="customFieldsToShow"
				@update:model-value="_customFields => {
					customFieldsToShow = customFields.filter(x => {
						return x.default || _customFields.map(y => y.uuid).includes(x.uuid)
					});
				}"
			/>

			<TagListSelect
				ref="tagSelectionModal"
				type="member"
				:model-value="member.tags.map(uuid => tags.find(x => x.uuid === uuid)!)"
				@update:model-value="tags => { member.tags = tags.map(x => x.uuid) }"
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
		right: 24px;
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

	.member-edit div.member-tags {
		padding: 8px 0 0 0;
		justify-content: start;
	}

	ion-avatar {
		width: 192px;
		height: 192px;
		outline-width: 8px !important;
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
		padding: 16px 16px 0px 16px;
	}

	div.member-description ion-label,
	div.member-custom-field ion-label {
		color: var(--ion-color-step-600, var(--ion-text-color-step-400, #666666));
	}
</style>