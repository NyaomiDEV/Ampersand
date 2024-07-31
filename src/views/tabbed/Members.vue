<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonList,
		IonPage,
		IonSearchbar,
		IonTitle,
		IonToolbar,
		IonFab,
		IonFabButton,
		IonIcon,
		IonItem,
		IonItemSliding,
		IonItemOptions,
		IonItemOption,
		IonLabel
	} from '@ionic/vue';
	import { inject, provide, Ref, ref } from 'vue';
	import { getFilteredMembers } from '../../lib/db/liveQueries';
	import { addOutline as addIOS } from "ionicons/icons";
	import addMD from "@material-design-icons/svg/outlined/add.svg";
	import MemberEdit from '../../modals/MemberEdit.vue';
	import { Member } from '../../lib/db/entities/members';
	import { PartialBy } from '../../lib/db/types';
	import { getCurrentFrontEntryForMember, newFrontingEntry, removeFronter, setMainFronter, setSoleFronter } from '../../lib/db/entities/frontingEntries';
	import MemberAvatar from '../../components/member/MemberAvatar.vue';
	import MemberLabel from '../../components/member/MemberLabel.vue';

	const isIOS = inject<boolean>("isIOS");

	const search = ref("");
	const members = getFilteredMembers(search);

	const list: Ref<typeof IonList | undefined> = ref()

	const member: Ref<PartialBy<Member, "uuid"> | undefined> = ref();
	provide("member", member);

	const memberEditModal = ref();

	async function showModal(clickedMember?: Member){
		if(clickedMember)
			member.value = {...clickedMember};
		else {
			member.value = {
				name: "",
				isArchived: false,
				isCustomFront: false,
				tags: []
			};
		}

		await memberEditModal.value.$el.present();
	}

	function addFrontingEntry(member: Member) {
		newFrontingEntry({
			member: member.uuid,
			startTime: new Date(),
			isMainFronter: false
		});
		list.value?.$el.closeSlidingItems();
	}

	function removeFrontingEntry(member: Member) {
		removeFronter(member);
		list.value?.$el.closeSlidingItems();
	}

	function setMainFrontingEntry(member: Member, value: boolean){
		setMainFronter(member, value);
		list.value?.$el.closeSlidingItems();
	}

	function setSoleFrontingEntry(member: Member){
		setSoleFronter(member);
		list.value?.$el.closeSlidingItems();
	}

</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonTitle>
					{{ $t("members:header") }}
				</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('members:searchPlaceholder')"
					showCancelButton="focus"
					showClearButton="focus"
					:spellcheck="false"
					v-model="search"
				/>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS" ref="list">

				<IonItemSliding v-for="member in members" :key="JSON.stringify(member)">
					<IonItem button @click="showModal(member)" :style="!!getCurrentFrontEntryForMember(member) ? {'--background': 'var(--ion-background-color-step-150)'} : undefined">
						<MemberAvatar slot="start" :member />
						<MemberLabel :member />
					</IonItem>
					<IonItemOptions>
						<IonItemOption v-if="!getCurrentFrontEntryForMember(member)" @click="addFrontingEntry(member)">
							<IonLabel>
								{{ $t("members:actions.addToFront") }}
							</IonLabel>
						</IonItemOption>
						<IonItemOption v-if="getCurrentFrontEntryForMember(member)" @click="removeFrontingEntry(member)" color="danger">
							<IonLabel>
								{{ $t("members:actions.removeFromFront") }}
							</IonLabel>
						</IonItemOption>
						<IonItemOption v-if="getCurrentFrontEntryForMember(member) && !getCurrentFrontEntryForMember(member)?.isMainFronter" @click="setMainFrontingEntry(member, true)" color="secondary">
							<IonLabel>
								{{ $t("members:actions.setMainFronter") }}
							</IonLabel>
						</IonItemOption>
						<IonItemOption v-if="getCurrentFrontEntryForMember(member)?.isMainFronter" @click="setMainFrontingEntry(member, false)" color="secondary">
							<IonLabel>
								{{ $t("members:actions.unsetMainFronter") }}
							</IonLabel>
						</IonItemOption>
						<IonItemOption @click="setSoleFrontingEntry(member)" color="tertiary">
							<IonLabel>
								{{ $t("members:actions.setSoleFronter") }}
							</IonLabel>
						</IonItemOption>
					</IonItemOptions>
				</IonItemSliding>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="showModal()">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>

		<MemberEdit ref="memberEditModal" />
	</IonPage>
</template>
