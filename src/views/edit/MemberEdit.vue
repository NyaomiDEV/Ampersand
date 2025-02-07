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

	import {
		pencilOutline as pencilIOS,
		saveOutline as saveIOS,
		newspaperOutline as newspaperIOS,
		journalOutline as journalIOS,
		trashBinOutline as trashIOS
	} from "ionicons/icons";

	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg";
	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import newspaperMD from "@material-symbols/svg-600/outlined/newspaper.svg";
	import journalMD from "@material-symbols/svg-600/outlined/book.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { Member, Tag } from "../../lib/db/entities";
	import { getMembers, newMember, deleteMember, updateMember } from '../../lib/db/tables/members';
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

	const canEdit = ref(true);
	const isEditing = ref(false);
	const self = getCurrentInstance();

	async function toggleEditing(){
		if(!isEditing.value){
			isEditing.value = true;
			return;
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
			if(files[0].type == 'image/gif'){
				member.value.image = files[0];
				return;
			}
			member.value.image = await resizeImage(files[0]);
		}
	}

	function promptDeletion(): Promise<boolean> {
		return new Promise(async (resolve) => {
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
			}catch(e){
				return;
			}
		}
	}

	async function updateRoute() {
		loading.value = true;

		tags.value = await getTags();

		if(route.query.uuid){
			const _member = (await getMembers()).find(x => x.uuid === route.query.uuid);
			if(_member) member.value = _member;
			else member.value = {...emptyMember};
		} else member.value = {...emptyMember};

		if(route.query.disallowEditing){
			canEdit.value = false;
		} else {
			canEdit.value = true;
		}

		// are we editing?
		isEditing.value = !member.value.uuid;

		// set color
		updateColors();

		loading.value = false;
	}

	function updateColors(){
		if(member.value.color && member.value.color !== "#000000"){
			if(self?.vnode.el) addMaterialColors(rgbaToArgb(member.value.color), self?.vnode.el as HTMLElement);
		} else {
			if(self?.vnode.el) unsetMaterialColors(self?.vnode.el as HTMLElement);
		}
	}

	watch(route, updateRoute);
	onBeforeMount(updateRoute);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/members/" />
				<IonTitle>{{ !member.uuid ? $t("members:edit.headerAdd") : $t("members:edit.headerEdit") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<div class="avatar-container">
				<MemberAvatar :member />
				<IonButton shape="round" @click="modifyPicture" v-if="isEditing">
					<IonIcon slot="icon-only" :ios="pencilIOS" :md="pencilMD" />
				</IonButton>
			</div>

			<div class="member-info" v-if="!isEditing">
				<h1>{{ member.name }}</h1>
				<p>{{ member.pronouns }}</p>
				<p>{{ member.role }}</p>
				<p v-if="member.isCustomFront">{{ $t("members:edit.customFront") }}</p>
				<p v-if="member.isArchived">{{ $t("members:edit.archived") }}</p>
			</div>

			<div class="member-tags" v-if="!isEditing">
				<TagChip v-if="tags?.length" v-for="tag in member.tags" :key="tag" :tag="tags.find(x => x.uuid === tag)!" />
			</div>

			<div class="member-description" v-if="!isEditing">
				<IonLabel>{{ $t("members:edit.description") }}</IonLabel>
				<Markdown :markdown="member.description || $t('members:edit.noDescription')" />
			</div>

			<IonList class="member-actions" v-if="!isEditing">
				<IonItem button detail :router-link="`/options/messageBoard?q=@member:${member.uuid}`">
					<IonIcon :ios="newspaperIOS" :md="newspaperMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("members:edit.showBoardEntries") }}</IonLabel>
				</IonItem>
				<IonItem button detail>
					<IonIcon :ios="journalIOS" :md="journalMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("members:edit.showJournalEntries") }}</IonLabel>
				</IonItem>
			</IonList>

			<IonList class="member-edit" v-if="isEditing" inset>
				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('members:edit.name')" labelPlacement="floating" v-model="member.name" />
				</IonItem>
				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('members:edit.pronouns')" labelPlacement="floating" v-model="member.pronouns" />
				</IonItem>
				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('members:edit.role')" labelPlacement="floating" v-model="member.role" />
				</IonItem>
				<IonItem>
					<IonTextarea :fill="!isIOS ? 'outline' : undefined" auto-grow :label="$t('members:edit.description')" labelPlacement="floating" v-model="member.description" />
				</IonItem>
				<IonItem button>
					<Color v-model="member.color" @update:model-value="updateColors">
						<IonLabel>
							{{ $t("members:edit.color") }}
						</IonLabel>
					</Color>
				</IonItem>
				<IonItem button>
					<IonToggle v-model="member.isCustomFront">
						<IonLabel>
							{{ $t("members:edit.isCustomFront") }}
						</IonLabel>
					</IonToggle>
				</IonItem>
				<IonItem button>
					<IonToggle v-model="member.isArchived">
						<IonLabel>
							{{ $t("members:edit.isArchived") }}
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem button @click="tagSelectionModal?.$el.present()">
					<IonLabel>
						{{ $t("members:edit.tags") }}
						<div class="member-tags">
							<TagChip v-if="tags?.length" v-for="tag in member.tags" :key="tag" :tag="tags.find(x => x.uuid === tag)!" />
						</div>
					</IonLabel>
				</IonItem>
				<IonItem button v-if="member.uuid" @click="removeMember">
					<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" color="danger"/>
					<IonLabel color="danger">
						<h3>{{ $t("members:edit.delete.title") }}</h3>
						<p>{{ $t("other:genericDeleteDesc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem v-if="member.uuid" button @click="copyIdToClipboard">
					<IonLabel>
						<p>{{ $t("members:edit.memberID", { memberID: member.uuid }) }}</p>
					</IonLabel>
				</IonItem>
				<IonItem v-if="member.dateCreated" button @click="copyIdToClipboard">
					<IonLabel>
						<p>{{ $t("members:edit.dateCreated", { dateCreated: formatDate(member.dateCreated, true) }) }}</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="toggleEditing" v-if="member.name.length > 0 && canEdit">
					<IonIcon :ios="isEditing ? saveIOS : pencilIOS" :md="isEditing ? saveMD : pencilMD" />
				</IonFabButton>
			</IonFab>

			<TagListSelect
				ref="tagSelectionModal"
				:modelValue="member.tags.map(uuid => tags.find(x => x.uuid === uuid)!)"
				@update:modelValue="tags => { member.tags = tags.map(x => x.uuid) }"
			/>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	ion-content {
		--padding-bottom: 80px;
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

	div.avatar-container ion-button {
		position: absolute;
		bottom: 8px;
		right: 8px;
	}

	div.member-info {
		display: block;
		margin: auto;
		text-align: center;
	}

	div.member-info * {
		margin: 0;
	}

	div.member-description {
		padding: 16px;
	}

	div.member-description ion-label {
		color: var(--ion-color-step-600, var(--ion-text-color-step-400, #666666));
	}

	.md ion-input, .md ion-textarea {
		margin: 16px 0;
	}
</style>