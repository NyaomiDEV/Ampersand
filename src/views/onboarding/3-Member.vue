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

	import {
		pencilOutline as pencilIOS,
		arrowForwardOutline as ArrowIOS,
	} from "ionicons/icons";

	import pencilMD from "@material-symbols/svg-600/outlined/edit.svg";
	import ArrowMD from "@material-symbols/svg-600/outlined/arrow_forward.svg";

	import { Member } from "../../lib/db/entities";
	import { newMember } from '../../lib/db/tables/members';
	import { getFiles, slideAnimation } from "../../lib/util/misc";
	import { resizeImage } from "../../lib/util/image";
	import { inject, ref, toRaw } from "vue";
	import { PartialBy } from "../../lib/types";
	import MemberAvatar from "../../components/member/MemberAvatar.vue";

	const router = useIonRouter();

	const isIOS = inject<boolean>("isIOS")!;

	const emptyMember: PartialBy<Member, "uuid" | "dateCreated"> = {
		name: "",
		isArchived: false,
		isCustomFront: false,
		tags: []
	};
	const member = ref({...emptyMember});

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
			<h1> {{ $t('onboarding:memberInfo.header') }}</h1>
			<div class="avatar-container">
				<MemberAvatar :member />
				<IonButton shape="round" @click="modifyPicture">
					<IonIcon slot="icon-only" :ios="pencilIOS" :md="pencilMD" />
				</IonButton>
			</div>

			<IonList class="member-edit" inset>
					<IonItem>
						<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('members:edit.name')" labelPlacement="floating" v-model="member.name" />
					</IonItem>

					<IonItem>
						<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('members:edit.pronouns')" labelPlacement="floating" v-model="member.pronouns" />
					</IonItem>

					<IonItem>
						<IonTextarea :fill="!isIOS ? 'outline' : undefined" auto-grow :label="$t('onboarding:memberInfo.description')" labelPlacement="floating" v-model="member.description" />
					</IonItem>

					<p> {{ $t("onboarding:memberInfo:invitation") }}</p>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="member.name.length">
					<IonIcon :ios="ArrowIOS" :md="ArrowMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

<style scoped>

	h1 {
		margin-top: 128px;
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

	div.avatar-container ion-button {
		position: absolute;
		bottom: 8px;
		right: 8px;
	}
</style>