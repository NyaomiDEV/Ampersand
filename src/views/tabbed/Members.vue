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
	import { inject, onMounted, onUnmounted, Ref, ref, shallowReactive, shallowRef, watch, WatchStopHandle } from 'vue';
	import { getFilteredMembers } from '../../lib/db/search';
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
	import { getMembersTable, Member } from '../../lib/db/entities/members';
	import { PartialBy } from '../../lib/db/types';
	import { FrontingEntry, getCurrentFrontEntryForMember, getFrontingEntriesTable, newFrontingEntry, removeFronter, setMainFronter, setSoleFronter } from '../../lib/db/entities/frontingEntries';
	import MemberAvatar from '../../components/member/MemberAvatar.vue';
	import MemberLabel from '../../components/member/MemberLabel.vue';
	import { from, useObservable } from '@vueuse/rxjs';
	import { liveQuery } from 'dexie';

	const isIOS = inject<boolean>("isIOS");

	const search = ref("");
	const members = shallowRef<Member[]>([]);

	const filteredMembers = getFilteredMembers(search, members);
	const frontingEntries = shallowReactive(new Map<Member, FrontingEntry | undefined>());

	const list: Ref<typeof IonList | undefined> = ref()

	const emptyMember: PartialBy<Member, "uuid"> = {
		name: "",
		isArchived: false,
		isCustomFront: false,
		tags: []
	};
	const member = shallowRef<PartialBy<Member, "uuid">>({...emptyMember});

	const memberEditModal = ref();

	const watchStopHandlers: WatchStopHandle[] = [];

	onMounted(() => {
		watchStopHandlers.push(
			watch(
				useObservable(from(liveQuery(() => getMembersTable().toArray()))),
				async () => members.value = await getMembersTable().toArray(),
				{ immediate: true }
			),
			watch(
				[
					filteredMembers,
					useObservable(from(liveQuery(() => getFrontingEntriesTable().toArray())))
				], async () => {
					frontingEntries.clear();
					for(const member of filteredMembers.value)
						frontingEntries.set(member, await getCurrentFrontEntryForMember(member));
				},
				{ immediate: true }
			)
		);
	});

	onUnmounted(() => {
		watchStopHandlers.forEach(x => x());
		watchStopHandlers.length = 0;
	});

	async function showModal(clickedMember?: Member){
		if(clickedMember)
			member.value = {...clickedMember};
		else {
			member.value = {...emptyMember};
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

	function getStyle(member: Member){
		const style: Record<string, string> = {};

		const entry = frontingEntries.get(member);
		if(entry){
			if(entry.isMainFronter)
				style["--background"] = "var(--ion-background-color-step-200)";
			else
				style["--background"] = "var(--ion-background-color-step-150)";
		}

		return style;
	}

	async function drag(member: Member){
		const entry = await getCurrentFrontEntryForMember(member);
		if(entry){
			if(entry.isMainFronter)
				return setMainFrontingEntry(member, false);

			return setMainFrontingEntry(member, true);
		}
	}

	const longPressHandlers = new Map<Member, any>();
	function startPress(member: Member){
		longPressHandlers.set(
			member,
			setTimeout(async () => {
			const entry = await getCurrentFrontEntryForMember(member);
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

				<IonItemSliding v-for="member in filteredMembers" @ionDrag="endPress(member, true)" :key="JSON.stringify(member)">
					<IonItem button :class="{ archived: member.isArchived }" :style="getStyle(member)" @pointerdown="startPress(member)" @pointerup="endPress(member, false)">
						<MemberAvatar slot="start" :member />
						<MemberLabel :member />
						<IonIcon slot="end" :ios="archivedIOS" :md="archivedMD" v-if="member.isArchived" />
						<IonIcon slot="end" :ios="mainFronterIOS" :md="mainFronterMD" v-if="frontingEntries.get(member)?.isMainFronter" />
					</IonItem>
					<IonItemOptions @ionSwipe="drag(member)">
						<IonItemOption v-if="!frontingEntries.get(member)" @click="addFrontingEntry(member)">
							<IonIcon slot="icon-only" :md="addToFrontMD" :ios="addToFrontIOS"></IonIcon>
						</IonItemOption>
						<IonItemOption v-if="frontingEntries.get(member)" @click="removeFrontingEntry(member)" color="danger">
							<IonIcon slot="icon-only" :md="removeFromFrontMD" :ios="removeFromFrontIOS"></IonIcon>
						</IonItemOption>
						<IonItemOption expandable v-if="frontingEntries.get(member) && !frontingEntries.get(member)?.isMainFronter" @click="setMainFrontingEntry(member, true)" color="secondary">
							<IonIcon slot="icon-only" :md="setMainFronterMD" :ios="setMainFronterIOS"></IonIcon>
						</IonItemOption>
						<IonItemOption expandable v-if="frontingEntries.get(member)?.isMainFronter" @click="setMainFrontingEntry(member, false)" color="secondary">
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

		<MemberEdit ref="memberEditModal" :member />
	</IonPage>
</template>

<style scoped>
	ion-item.archived > * {
		opacity: 0.5;
	}
</style>