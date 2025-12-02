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
	} from "@ionic/vue";
	import { onBeforeMount, onUnmounted, reactive, ref, shallowRef, useTemplateRef, watch } from "vue";
	import { accessibilityConfig, appConfig } from "../lib/config/index.ts";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import pinMD from "@material-symbols/svg-600/outlined/keep.svg";
	import addToFrontMD from "@material-symbols/svg-600/outlined/person_add.svg";
	import removeFromFrontMD from "@material-symbols/svg-600/outlined/person_remove.svg";
	import setMainFronterMD from "@material-symbols/svg-600/outlined/arrow_circle_up.svg";
	import unsetMainFronterMD from "@material-symbols/svg-600/outlined/arrow_circle_down.svg";
	import mainFronterMD from "@material-symbols/svg-600/outlined/account_circle-fill.svg";
	import setAsFrontMD from "@material-symbols/svg-600/outlined/person_pin_circle.svg";
	import archivedMD from "@material-symbols/svg-600/outlined/archive.svg";

	import { getFilteredMembers } from "../lib/db/tables/members.ts";
	import type { Member, FrontingEntry } from "../lib/db/entities";
	import { getCurrentFrontEntryForMember, newFrontingEntry, removeFronter, sendFrontingChangedEvent, setMainFronter, setSoleFronter } from "../lib/db/tables/frontingEntries.ts";
	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import MemberLabel from "../components/member/MemberLabel.vue";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events.ts";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import { useRoute } from "vue-router";
	import { getObjectURL } from "../lib/util/blob.ts";
	import { toast } from "../lib/util/misc.ts";
	import { useTranslation } from "i18next-vue";

	const route = useRoute();
	const i18next = useTranslation();

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.query.q)
			search.value = route.query.q as string;
	});

	const members = shallowRef<Member[]>();

	watch(search, async () => {
		await updateMembers();
	});

	const frontingEntries = reactive(new Map<Member, FrontingEntry | undefined>());

	const list = useTemplateRef("list");
	const router = useIonRouter();

	const listeners = [
		(event: Event) => {
			if((event as DatabaseEvent).data.table === "members")
				void updateMembers();
		},
		(event: Event) => {
			if((event as DatabaseEvent).data.table === "frontingEntries"){
				frontingEntries.clear();
				if(members.value){
					for(const member of members.value)
						void (async () => frontingEntries.set(member, await getCurrentFrontEntryForMember(member)))();
				}
			}
		}
	];

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listeners[0]);
		DatabaseEvents.addEventListener("updated", listeners[1]);
		await updateMembers();
		frontingEntries.clear();
		if(members.value){
			for (const member of members.value)
				frontingEntries.set(member, await getCurrentFrontEntryForMember(member));
		}
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listeners[0]);
		DatabaseEvents.removeEventListener("updated", listeners[1]);
	});

	async function updateMembers(){
		members.value = (await Array.fromAsync(getFilteredMembers(search.value)))
			.sort((a, b) => {
				if (appConfig.showMembersBeforeCustomFronts) {
					if (!a.isCustomFront && b.isCustomFront) return -1;
					if (a.isCustomFront && !b.isCustomFront) return 1;
				}

				if (a.isPinned && !b.isPinned) return -1;
				if (!a.isPinned && b.isPinned) return 1;

				return a.name.localeCompare(b.name);
			});
	}

	async function addFrontingEntry(member: Member) {
		await newFrontingEntry({
			member: member.id,
			startTime: new Date(),
			isMainFronter: false,
			isLocked: false
		});
		void sendFrontingChangedEvent();
		await toast(i18next.t("members:toasts.addToFront"));

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		list.value?.$el.closeSlidingItems();
	}

	async function removeFrontingEntry(member: Member) {
		await removeFronter(member);
		void sendFrontingChangedEvent();
		await toast(i18next.t("members:toasts.removeFromFront"));

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		list.value?.$el.closeSlidingItems();
	}

	async function setMainFrontingEntry(member: Member, value: boolean){
		await setMainFronter(member, value);
		void sendFrontingChangedEvent();
		if(value) await toast(i18next.t("members:toasts.setMainFronter"));
		else await toast(i18next.t("members:toasts.unsetMainFronter"));

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		list.value?.$el.closeSlidingItems();
	}

	async function setSoleFrontingEntry(member: Member){
		await setSoleFronter(member);
		void sendFrontingChangedEvent();
		await toast(i18next.t("members:toasts.setSoleFronter"));
		
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
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

		if(member.cover)
			style["--data-cover"] = `url(${getObjectURL(member.cover)})`;

		return style;
	}

	const longPressHandlers = new Map<Member, number>();
	function startPress(member: Member){
		longPressHandlers.set(
			member,
			setTimeout(async () => {
				const entry = await getCurrentFrontEntryForMember(member);
				if(entry)
					await removeFrontingEntry(member);
				else
					await addFrontingEntry(member);

				longPressHandlers.delete(member);
			}, accessibilityConfig.longPressDuration)
		);
	}

	function endPress(member: Member, dragged: boolean){
		const timeoutHandler = longPressHandlers.get(member);
		if(!timeoutHandler) return;
		clearTimeout(timeoutHandler);
		longPressHandlers.delete(member);
		if(!dragged) router.push(`/members/edit?uuid=${member.id}`);
	}

	function numberOfFronters() {
		return Array.from(frontingEntries.values()).filter(x => !!x).length;
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" :icon="backMD" />
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
					@ion-change="e => search = e.detail.value || ''"
				/>
			</IonToolbar>
		</IonHeader>
		
		<SpinnerFullscreen v-if="!members" />
		<IonContent v-else>
			<IonList ref="list" :class="{ compact: accessibilityConfig.disableMemberCoversInList }">

				<IonItemSliding v-for="member in members" :key="member.id" @ion-drag="endPress(member, true)">
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
						<MemberLabel :member show-tag-chips />
						<IonIcon v-if="member.isPinned" slot="end" :icon="pinMD" />
						<IonIcon v-if="member.isArchived" slot="end" :icon="archivedMD" />
						<IonIcon v-if="frontingEntries.get(member)?.isMainFronter" slot="end" :icon="mainFronterMD" />
					</IonItem>
					<IonItemOptions>
						<IonItemOption v-if="!frontingEntries.get(member) && numberOfFronters() !== 0" @click="addFrontingEntry(member)">
							<IonIcon slot="icon-only" :icon="addToFrontMD" />
						</IonItemOption>
						<IonItemOption v-if="frontingEntries.get(member)" color="danger" @click="removeFrontingEntry(member)">
							<IonIcon slot="icon-only" :icon="removeFromFrontMD" />
						</IonItemOption>
						<IonItemOption v-if="frontingEntries.get(member) && !frontingEntries.get(member)?.isMainFronter" color="secondary" @click="setMainFrontingEntry(member, true)">
							<IonIcon slot="icon-only" :icon="setMainFronterMD" />
						</IonItemOption>
						<IonItemOption v-if="frontingEntries.get(member)?.isMainFronter" color="secondary" @click="setMainFrontingEntry(member, false)">
							<IonIcon slot="icon-only" :icon="unsetMainFronterMD" />
						</IonItemOption>
						<IonItemOption v-if="!(numberOfFronters() === 1 && frontingEntries.get(member))" color="tertiary" @click="setSoleFrontingEntry(member)">
							<IonIcon slot="icon-only" :icon="setAsFrontMD" />
						</IonItemOption>
					</IonItemOptions>
				</IonItemSliding>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton router-link="/members/edit/">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	ion-item.archived > * {
		opacity: 0.5;
	}

	ion-item ion-avatar {
		width: 56px;
		height: 56px;
	}

	ion-item-option {
		border-radius: 28px;
		width: 56px;
		height: 56px;
		margin: auto 8px;
	}

	ion-item-option:last-child {
		margin-right: 16px;
	}

	ion-list:not(.compact) ion-item {
		margin: 4px 16px;
		--background: var(--ion-background-color-step-100);
	}

	ion-list:not(.compact) ion-item::part(native) {
		border-radius: 16px;
	}

	ion-list:not(.compact) ion-item::part(native)::before {
		content: '\A';
		background-image: var(--data-cover);
		background-position: center;
		background-size: cover;
		width: calc(100% + 16px);
		height: 100%;
		display: block;
		position: absolute;
		z-index: -1;
		left: -16px;
		opacity: .25;
		mask-image: radial-gradient(circle at 0% 100%, black, transparent 100%);
	}
</style>