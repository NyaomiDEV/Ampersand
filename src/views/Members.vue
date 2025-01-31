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
		useIonRouter,
		IonBackButton,
	} from '@ionic/vue';
	import { inject, onBeforeMount, onUnmounted, ref, shallowReactive, shallowRef, useTemplateRef, watch } from 'vue';
	import { getFilteredMembers } from '../lib/search.ts';
	import { accessibilityConfig } from '../lib/config/index.ts';

	import {
		addOutline as addIOS,
		personAddOutline as addToFrontIOS,
		personRemoveOutline as removeFromFrontIOS,
		arrowUpCircleOutline as setMainFronterIOS,
		arrowDownCircleOutline as unsetMainFronterIOS,
		personCircleOutline as mainFronterIOS,
		personCircleOutline as setAsFrontIOS,
		archiveOutline as archivedIOS
	} from "ionicons/icons";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import addToFrontMD from "@material-symbols/svg-600/outlined/person_add.svg";
	import removeFromFrontMD from "@material-symbols/svg-600/outlined/person_remove.svg";
	import setMainFronterMD from "@material-symbols/svg-600/outlined/arrow_circle_up.svg";
	import unsetMainFronterMD from "@material-symbols/svg-600/outlined/arrow_circle_down.svg";
	import mainFronterMD from "@material-symbols/svg-600/outlined/account_circle-fill.svg";
	import setAsFrontMD from "@material-symbols/svg-600/outlined/person_pin_circle.svg";
	import archivedMD from "@material-symbols/svg-600/outlined/archive.svg";

	import { getMembers } from '../lib/db/tables/members.ts';
	import type { Member, FrontingEntry } from '../lib/db/entities';
	import { getCurrentFrontEntryForMember, newFrontingEntry, removeFronter, setMainFronter, setSoleFronter } from '../lib/db/tables/frontingEntries.ts';
	import MemberAvatar from '../components/member/MemberAvatar.vue';
	import MemberLabel from '../components/member/MemberLabel.vue';
	import { DatabaseEvents, DatabaseEvent } from '../lib/db/events.ts';
	import SpinnerFullscreen from '../components/SpinnerFullscreen.vue';
	import { useRoute } from 'vue-router';

	const route = useRoute();

	const isIOS = inject<boolean>("isIOS");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		search.value = route.query.q as string || "";
	});

	const members = shallowRef<Member[]>();
	const filteredMembers = getFilteredMembers(search, members);
	const frontingEntries = shallowReactive(new Map<Member, FrontingEntry | undefined>());

	const list = useTemplateRef('list');
	const router = useIonRouter();

	const listeners = [
		async (event: Event) => {
			if((event as DatabaseEvent).data.table === "members")
				members.value = await getMembers();
		},
		async (event: Event) => {
			if((event as DatabaseEvent).data.table === "frontingEntries"){
				frontingEntries.clear();
				if(members.value){
					for(const member of members.value)
						frontingEntries.set(member, await getCurrentFrontEntryForMember(member));
				}
			}
		}
	]

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listeners[0]);
		DatabaseEvents.addEventListener("updated", listeners[1]);
		members.value = await getMembers();
		frontingEntries.clear();
		for(const member of members.value)
			frontingEntries.set(member, await getCurrentFrontEntryForMember(member));
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listeners[0]);
		DatabaseEvents.removeEventListener("updated", listeners[1]);
	});

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
		if(!dragged) router.push("/members/edit?uuid=" + member.uuid);
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" />
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
		
		<SpinnerFullscreen v-if="!members" />
		<IonContent v-else>
			<IonList :inset="isIOS" ref="list">

				<IonItemSliding v-for="member in filteredMembers" @ionDrag="endPress(member, true)" :key="JSON.stringify(member)">
					<IonItem
						button
						:class="{ archived: member.isArchived }"
						:style="getStyle(member)"
						@pointerdown="startPress(member)"
						@pointerup="endPress(member, false)"
						@pointercancel="endPress(member, true)"
						@pointerleave="endPress(member, true)"
					>
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
				<IonFabButton routerLink="/members/edit/">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	ion-item.archived > * {
		opacity: 0.5;
	}
</style>