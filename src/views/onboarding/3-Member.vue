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

	import { Member } from "../../lib/db/entities";
	import { newMember } from "../../lib/db/tables/members";
	import { getFiles, slideAnimation } from "../../lib/util/misc";
	import { resizeImage } from "../../lib/util/image";
	import { ref, toRaw } from "vue";
	import { PartialBy } from "../../lib/types";
	import MemberAvatar from "../../components/member/MemberAvatar.vue";
	import { appConfig } from "../../lib/config";
	import { newFile } from "../../lib/db/tables/files";

	const router = useIonRouter();

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

	async function modifyPicture(){
		const files = await getFiles();
		if(files.length){
			if(files[0].type === "image/gif"){
				const file = await newFile(files[0].name, files[0].stream());
				member.value.image = file;
				return;
			}
			const file = await newFile(files[0].name, (await resizeImage(files[0])).stream());
			member.value.image = file;
		}
	}

	function deletePicture(){
		delete member.value.image;
	}

	async function save(){
		const _member = toRaw(member.value);
		await newMember({
			..._member,
			dateCreated: new Date()
		});
		router.replace("/onboarding/end/", slideAnimation);
	}
</script>

<template>
	<IonPage>
		<IonContent>
			<div class="container">
				<h1> {{ $t('onboarding:memberInfo.header') }}</h1>
				<div class="avatar-container">
					<MemberAvatar :member />
					<div class="edit-buttons">
						<IonButton shape="round" @click="modifyPicture">
							<IonIcon slot="icon-only" :icon="pencilMD" />
						</IonButton>
						<IonButton shape="round" color="danger" @click="deletePicture">
							<IonIcon slot="icon-only" :icon="trashMD" />
						</IonButton>
					</div>
				</div>

				<IonList class="member-edit" inset>
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
						<IonTextarea
							v-model="member.description"
							fill="outline"
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

	ion-avatar {
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