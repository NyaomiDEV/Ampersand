<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonAvatar, IonButton, IonIcon, IonInput, IonFab, IonFabButton, IonItem, IonLabel } from "@ionic/vue";
	import { inject, onMounted, ref } from "vue";
	import { getObjectURL } from "../../lib/util/blob";
	import { getFiles } from "../../lib/util/misc";
	import { resizeImage } from "../../lib/util/image";
	import { getSystem, modifySystem } from "../../lib/db/tables/system";
	import { getMembers } from "../../lib/db/tables/members";
	import ContentEditable from "../../components/ContentEditable.vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import accountCircle from "@material-symbols/svg-600/outlined/account_circle.svg";
	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg";
	import saveMD from "@material-symbols/svg-600/outlined/save.svg";

	const isIOS = inject<boolean>("isIOS");

	const membersShowed = ref(false);
	const memberCount = ref(0);
	const archivedMemberCount = ref(0);

	const system = ref();

	async function modifyPicture(){
		const files = await getFiles();
		if(files.length){
			if(files[0].type === "image/gif"){
				system.value.image = files[0];
				return;
			}
			system.value.image = await resizeImage(files[0]);	
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const router: any = inject("navManager");

	async function save() {
		await modifySystem({...system.value});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		router.handleNavigateBack("/options/");
	}

	onMounted(async () => {
		system.value = await getSystem();
		let _memberCount = 0;
		let _archivedMemberCount = 0;
		for await(const member of getMembers()){
			if(!member.isCustomFront){
				_memberCount++;
				if(member.isArchived)
					_archivedMemberCount++;
			}
		}
		memberCount.value = _memberCount;
		archivedMemberCount.value = _archivedMemberCount;
	});
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					:text="isIOS ? $t('other:back') : undefined"
					:icon="!isIOS ? backMD : undefined"
					default-href="/options/"
				/>
				<IonTitle>
					{{ $t("systemSettings:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<div class="avatar-container">
				<IonAvatar>
					<img v-if="system?.image" aria-hidden="true" :src="getObjectURL(system.image)" />
					<IonIcon v-else :icon="accountCircle" />
				</IonAvatar>

				<IonButton shape="round" @click="modifyPicture">
					<IonIcon slot="icon-only" :icon="pencilMD" />
				</IonButton>
			</div>

			<IonList v-if="system" inset>
				<IonItem>
					<IonInput
						v-model="system.name"
						:fill="!isIOS ? 'outline' : undefined"
						label-placement="floating"
						:label="$t('systemSettings:systemName')"
					/>
				</IonItem>
				<IonItem>
					<ContentEditable v-model="system.description" :label="$t('systemSettings:systemDescription')" />
				</IonItem>
				<IonItem>
					<IonLabel>{{ $t("systemSettings:memberCount") }}</IonLabel>
					<IonButton v-if="!membersShowed" slot="end" @click="membersShowed = true">{{ $t("systemSettings:tapToShow") }}</IonButton>
					<IonLabel v-if="membersShowed" slot="end">{{ $t("systemSettings:memberCountText", { memberCount, archivedMemberCount }) }}</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save">
					<IonIcon :icon="saveMD" />
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

	ion-avatar {
		width: 192px;
		height: 192px;
	}

	div.avatar-container ion-button {
		position: absolute;
		bottom: 8px;
		right: 8px;
	}

	div.avatar-container ion-avatar ion-icon {
		width: 100%;
		height: 100%;
		color: var(--ion-color-primary);
	}
</style>