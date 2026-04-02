<script setup lang="ts">
	import {
		IonContent,
		IonPage,
		IonSearchbar,
		IonTitle,
		IonToolbar,
		IonFab,
		IonFabButton,
		IonIcon,
		IonItemSliding,
		IonItemOptions,
		IonItemOption,
		IonBackButton,
		IonList,
	} from "@ionic/vue";
	import { onBeforeMount, onUnmounted, ref, shallowRef, useTemplateRef, watch } from "vue"; 
	import CollapsibleHeaderbar from "../components/CollapsibleHeaderbar.vue";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import addToFrontMD from "@material-symbols/svg-600/outlined/person_add.svg";
	import removeFromFrontMD from "@material-symbols/svg-600/outlined/person_remove.svg";
	import setMainFronterMD from "@material-symbols/svg-600/outlined/arrow_circle_up.svg";
	import unsetMainFronterMD from "@material-symbols/svg-600/outlined/arrow_circle_down.svg";
	import setAsFrontMD from "@material-symbols/svg-600/outlined/person_pin_circle.svg";
	import copyMD from "@material-symbols/svg-600/outlined/content_copy.svg";

	import { getFilteredMembers } from "../lib/db/tables/members.ts";
	import type { Member, FrontingEntryComplete } from "../lib/db/entities";
	import { getFronting, newFrontingEntry, removeFronter, sendFrontingChangedEvent, setMainFronter, setSoleFronter } from "../lib/db/tables/frontingEntries.ts";
	import MemberItem from "../components/member/MemberItem.vue";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events.ts";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import { useRoute } from "vue-router";
	import { toast } from "../lib/util/misc.ts";
	import { useTranslation } from "i18next-vue";
	import VirtualList from "../components/VirtualList.vue";
	import InfiniteLoader from "../components/InfiniteLoader.vue";

	const isStandalone = ref(false);

	const route = useRoute();
	const i18next = useTranslation();

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.name?.toString().endsWith("Members") && route.query.q)
			search.value = route.query.q as string;

		if(route.path.startsWith("/s/")) isStandalone.value = true;
		else isStandalone.value = false;
	}, { immediate: true });

	const members = shallowRef<Member[]>();
	const iter = shallowRef(getFilteredMembers(search.value));
	const iterDone = ref(false);
	watch(search, async () => {
		await resetMembers();
	});
	const frontingEntries = shallowRef<FrontingEntryComplete[]>([]);
	const list = useTemplateRef("list");

	const listeners = [
		(event: Event) => {
			if((event as DatabaseEvent).data.table === "members")
				void resetMembers();
		},
		(event: Event) => {
			if((event as DatabaseEvent).data.table === "frontingEntries")
				void updateFronters();
			
		}
	];
	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listeners[0]);
		DatabaseEvents.addEventListener("updated", listeners[1]);
		await resetMembers();
		await updateFronters();

	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listeners[0]);
		DatabaseEvents.removeEventListener("updated", listeners[1]);
	});

	async function resetMembers(){
		members.value = undefined;
		iterDone.value = false;
		iter.value = getFilteredMembers(search.value);
		await pollMembers();
	}

	async function pollMembers(cb?: () => void){
		let i = 0;
		const _mems: Member[] = [];
		while(true) {
			const data = await iter.value.next();
			if(data.value) _mems.push(data.value);
			i++;
			if(data.done) iterDone.value = true;
			if(i >= 20 || data.done) break;
		}

		if(!members.value)
			members.value = _mems;
		else
			members.value = [...members.value, ..._mems];

		if(cb)
			cb();
	}

	async function updateFronters() {
		frontingEntries.value = await getFronting();
	}

	async function addFrontingEntry(member: Member) {
		try {
			const result = await newFrontingEntry({
				member: member.uuid,
				startTime: new Date(),
				isMainFronter: false,
				isLocked: false
			});
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

			void sendFrontingChangedEvent();
			await toast(i18next.t("members:toasts.addToFront"));
		}catch(e){
			await toast((e as Error).message);
		}

		closeSlidingItems();
	}

	async function removeFrontingEntry(member: Member) {
		try{
			const result = await removeFronter(member);
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

			void sendFrontingChangedEvent();
			await toast(i18next.t("members:toasts.removeFromFront"));
		}catch(e){
			await toast((e as Error).message);
		}

		closeSlidingItems();
	}

	async function setMainFrontingEntry(member: Member, value: boolean){
		try{
			const result = await setMainFronter(member, value);
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

			void sendFrontingChangedEvent();
			if(value) await toast(i18next.t("members:toasts.setMainFronter"));
			else await toast(i18next.t("members:toasts.unsetMainFronter"));
		}catch(e){
			await toast((e as Error).message);
		}

		closeSlidingItems();
	}

	async function setSoleFrontingEntry(member: Member){
		try{
			const result = await setSoleFronter(member);
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

			void sendFrontingChangedEvent();
			await toast(i18next.t("members:toasts.setSoleFronter"));
		}catch(e){
			await toast((e as Error).message);
		}
		closeSlidingItems();
	}

	function closeSlidingItems() {
		const el: globalThis.HTMLIonListElement = list.value?.$el;
		if(!el) return;
		const items = el.querySelectorAll<globalThis.HTMLIonItemSlidingElement>("ion-item-sliding");
		items?.forEach(i => void i.closeOpened());
	}

	async function copyID(member: Member){
		try{
			await window.navigator.clipboard.writeText(`@<m:${member.uuid}>`);
			await toast(i18next.t("members:edit.memberIDcopiedToClipboard"));
			closeSlidingItems();
		}catch(_e){
			return;
		}
	}

	function feGet(member: Member){
		return frontingEntries.value.find(x => x.member.uuid === member.uuid);
	}
</script>

<template>
	<IonPage>		
		<SpinnerFullscreen v-if="!members" />
		<IonContent v-else :scroll-events="true">
			<CollapsibleHeaderbar class="size-large">
				<IonToolbar>
					<IonBackButton
						v-if="route.name === 'StandaloneMembers'"
						slot="start"
						default-href="/"
					/>
					<IonTitle>
						{{ $t("members:header") }}
					</IonTitle>
				</IonToolbar>
				<IonToolbar>
					<IonSearchbar
						:animated="true"
						:placeholder="$t('members:searchPlaceholder')"
						show-cancel-button="focus"
						show-clear-button="focus"
						:spellcheck="false"
						:value="search"
						@ion-change="e => search = e.detail.value || ''"
					/>
				</IonToolbar>
			</CollapsibleHeaderbar>

			<IonList ref="list">
				<VirtualList :entries="members" :min-size="86" :gap="2">
					<template #default="{ entry: member }">
						<IonItemSliding>
							<MemberItem
								button
								:member
								:associated-fronting-entry="feGet(member)"
								show-chips
								show-icons
								show-archived
								:router-link="`/members/edit?uuid=${member.uuid}`"
							/>
							<IonItemOptions>
								<IonItemOption color="tertiary" @click="copyID(member)">
									<IonIcon slot="icon-only" :icon="copyMD" />
								</IonItemOption>
								<IonItemOption v-if="!feGet(member) && frontingEntries.length !== 0" @click="addFrontingEntry(member)">
									<IonIcon slot="icon-only" :icon="addToFrontMD" />
								</IonItemOption>
								<IonItemOption v-if="feGet(member)" color="danger" @click="removeFrontingEntry(member)">
									<IonIcon slot="icon-only" :icon="removeFromFrontMD" />
								</IonItemOption>
								<IonItemOption v-if="feGet(member) && !feGet(member)?.isMainFronter" color="secondary" @click="setMainFrontingEntry(member, true)">
									<IonIcon slot="icon-only" :icon="setMainFronterMD" />
								</IonItemOption>
								<IonItemOption v-if="feGet(member)?.isMainFronter" color="secondary" @click="setMainFrontingEntry(member, false)">
									<IonIcon slot="icon-only" :icon="unsetMainFronterMD" />
								</IonItemOption>
								<IonItemOption v-if="!(frontingEntries.length === 1 && feGet(member))" color="tertiary" @click="setSoleFrontingEntry(member)">
									<IonIcon slot="icon-only" :icon="setAsFrontMD" />
								</IonItemOption>
							</IonItemOptions>
						</IonItemSliding>
					</template>
				</VirtualList>
			</IonList>

			<InfiniteLoader v-if="!iterDone" @infinite="pollMembers" />

			<IonFab
				v-if="!isStandalone"
				slot="fixed"
				vertical="bottom"
				horizontal="end"
			>
				<IonFabButton router-link="/members/edit/">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>
