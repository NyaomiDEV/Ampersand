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
	} from '@ionic/vue';
	import { inject, provide, Ref, ref } from 'vue';
	import { getFilteredMembers } from '../../lib/db/liveQueries';
	import { accessibilityConfig } from '../../lib/config';

	import {
		addOutline as addIOS,
		personAddOutline as addToFrontIOS,
		personRemoveOutline as removeFromFrontIOS,
		arrowUpCircleOutline as setMainFronterIOS,
		arrowDownCircleOutline as unsetMainFronterIOS,
		ellipseOutline as mainFronterIOS,
		personCircleOutline as setAsFrontIOS,
		archiveOutline as archivedIOS
	} from "ionicons/icons";

	import addMD from "@material-design-icons/svg/outlined/add.svg";
	import addToFrontMD from "@material-design-icons/svg/outlined/person_add.svg";
	import removeFromFrontMD from "@material-design-icons/svg/outlined/person_remove.svg";
	import setMainFronterMD from "@material-design-icons/svg/outlined/arrow_circle_up.svg";
	import unsetMainFronterMD from "@material-design-icons/svg/outlined/arrow_circle_down.svg";
	import mainFronterMD from "@material-design-icons/svg/outlined/circle.svg";
	import setAsFrontMD from "@material-design-icons/svg/outlined/person_pin_circle.svg";
	import archivedMD from "@material-design-icons/svg/outlined/archive.svg";

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

	function getHighlightLevel(member: Member){
		const entry = getCurrentFrontEntryForMember(member);
		if(entry){
			if(entry.isMainFronter)
				return {'--background': 'var(--ion-background-color-step-200)'};

			return {'--background': 'var(--ion-background-color-step-150)'}
		}
		
		return undefined
	}

	function drag(member: Member){
		const entry = getCurrentFrontEntryForMember(member);
		if(entry){
			if(entry.isMainFronter)
				return setMainFrontingEntry(member, false);

			return setMainFrontingEntry(member, true);
		}
	}

	const longPressHandlers = new Map();
	function startPress(member: Member){
		longPressHandlers.set(
			member,
			setTimeout(() => {
			const entry = getCurrentFrontEntryForMember(member);
				if(entry)
					removeFrontingEntry(member);
				else
					addFrontingEntry(member);

				longPressHandlers.delete(member);
			}, accessibilityConfig.longPressDuration)
		);
	}

	function endPress(member: Member, dragged: boolean){
		const timeoutHandler = longPressHandlers.get(member);
		if(!timeoutHandler) return;
		clearTimeout(timeoutHandler);
		longPressHandlers.delete(member);
		if(!dragged) showModal(member);
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

				<IonItemSliding v-for="member in members" @ionDrag="endPress(member, true)" :key="JSON.stringify(member)">
					<IonItem button @pointerdown="startPress(member)" @pointerup="endPress(member, false)" :style="getHighlightLevel(member)">
						<MemberAvatar slot="start" :member />
						<MemberLabel :member />
						<IonIcon slot="end" :ios="archivedIOS" :md="archivedMD" v-if="member.isArchived" />
						<IonIcon slot="end" :ios="mainFronterIOS" :md="mainFronterMD" v-if="getCurrentFrontEntryForMember(member)?.isMainFronter" />
					</IonItem>
					<IonItemOptions @ionSwipe="drag(member)">
						<IonItemOption v-if="!getCurrentFrontEntryForMember(member)" @click="addFrontingEntry(member)">
							<IonIcon slot="icon-only" :md="addToFrontMD" :ios="addToFrontIOS"></IonIcon>
						</IonItemOption>
						<IonItemOption v-if="getCurrentFrontEntryForMember(member)" @click="removeFrontingEntry(member)" color="danger">
							<IonIcon slot="icon-only" :md="removeFromFrontMD" :ios="removeFromFrontIOS"></IonIcon>
						</IonItemOption>
						<IonItemOption expandable v-if="getCurrentFrontEntryForMember(member) && !getCurrentFrontEntryForMember(member)?.isMainFronter" @click="setMainFrontingEntry(member, true)" color="secondary">
							<IonIcon slot="icon-only" :md="setMainFronterMD" :ios="setMainFronterIOS"></IonIcon>
						</IonItemOption>
						<IonItemOption expandable v-if="getCurrentFrontEntryForMember(member)?.isMainFronter" @click="setMainFrontingEntry(member, false)" color="secondary">
							<IonIcon slot="icon-only" :md="unsetMainFronterMD" :ios="unsetMainFronterIOS"></IonIcon>
						</IonItemOption>
						<IonItemOption @click="setSoleFrontingEntry(member)" color="tertiary">
							<IonIcon slot="icon-only" :md="setAsFrontMD" :ios="setAsFrontIOS"></IonIcon>
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
