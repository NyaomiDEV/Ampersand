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
	import ArrowMD from "@material-symbols/svg-600/outlined/arrow_forward.svg";

	import { Member } from "../../lib/db/entities";
	import { newMember } from "../../lib/db/tables/members";
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
			if(files[0].type === "image/gif"){
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
			<div class="container">
				<h1> {{ $t('onboarding:memberInfo.header') }}</h1>
				<div class="avatar-container">
					<MemberAvatar :member />
					<IonButton shape="round" @click="modifyPicture">
						<IonIcon slot="icon-only" :icon="pencilMD" />
					</IonButton>
				</div>

				<IonList class="member-edit" inset>
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
						<IonTextarea
							v-model="member.description"
							:fill="!isIOS ? 'outline' : undefined"
							auto-grow
							:label="$t('onboarding:memberInfo.description')"
							label-placement="floating"
						/>
					</IonItem>
				</IonList>

				<p>{{ $t("onboarding:memberInfo:invitation") }}</p>
			</div>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="member.name.length" @click="save">
					<IonIcon :icon="ArrowMD" />
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

	div.avatar-container ion-button {
		position: absolute;
		bottom: 8px;
		right: 8px;
	}
</style>