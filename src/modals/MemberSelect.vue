<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonModal,
		IonSearchbar,
		modalController,
		IonList,
		IonFab,
		IonFabButton,
		IonIcon
	} from "@ionic/vue";

	import { accessibilityConfig } from "../lib/config/index.ts";
	import { onBeforeMount, onUnmounted, ref, shallowRef, toRaw, watch } from "vue";
	import type { Member } from "../lib/db/entities.d.ts";
	import { getFilteredMembers, isValidMember } from "../lib/db/tables/members";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import VirtualList from "../components/VirtualList.vue";
	import InfiniteLoader from "../components/InfiniteLoader.vue";
	import MemberItem from "../components/member/MemberItem.vue";
	import TheresNothingHere from "../components/TheresNothingHere.vue";

	import checkMD from "@material-symbols/svg-600/rounded/check.svg";

	const props = defineProps<{
		customTitle?: string,
		onlyOne?: boolean,
		alwaysEmit?: boolean,
		discardOnSelect?: boolean,
		hideFab?: boolean,
		modelValue?: Member[],
		hideCheckboxes?: boolean,
		membersToExclude?: (Member | string)[],
		membersToInclude?: (Member | string)[]
	}>();

	const emit = defineEmits<{
		"update:modelValue": [Member[]],
	}>();

	const selectedMembers = shallowRef<Member[]>([...props.modelValue || []]);
	const search = ref("");
	const members = shallowRef<Member[]>();
	const iter = shallowRef<AsyncGenerator<Member>>();
	const iterDone = ref(false);

	watch(props, () => {
		selectedMembers.value = [...props.modelValue || []];
	});

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "members")
			void resetMembers();
	};

	watch(search, async () => {
		await resetMembers();
	});
	
	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetMembers();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	function emitFiltered(members: Member[]){
		return emit("update:modelValue", members.filter(x => isValidMember(x)));
	}

	async function resetMembers(){
		members.value = undefined;
		iterDone.value = false;
		iter.value = getFilteredMembers(search.value);
		await pollMembers();
	}

	async function pollMembers(cb?: () => void){
		if(!iter.value) return;

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

	function check(member: Member, checked: boolean){
		// hideCheckboxes implies onlyOne
		const onlyOne = props.onlyOne || props.hideCheckboxes;
		if(checked){
			if(onlyOne)
				selectedMembers.value.length = 0;
			selectedMembers.value.push(member);
		} else {
			const index = selectedMembers.value.findIndex(x => x.uuid === member.uuid);
			if(index > -1){
				if(selectedMembers.value.length === 1 && onlyOne){
					// selected the one who was already selected since we're in "selection mode"
					// we will just not uncheck it
					// (hideCheckboxes implies onlyOne)
					if(props.discardOnSelect){
						void modalController.dismiss();
						if(props.alwaysEmit)
							emitFiltered([...toRaw(selectedMembers.value)]);
					}
					return;
				}
				selectedMembers.value.splice(index, 1);
			}
		}

		emitFiltered([...toRaw(selectedMembers.value)]);

		if(onlyOne && props.discardOnSelect)
			void modalController.dismiss();
	}

	function isDisabled(member: Member){
		return (
			(
				props.membersToInclude &&
				!props.membersToInclude.find(x => typeof x === "string" ? x === member.uuid : x.uuid === member.uuid)
			) ||
			!!props.membersToExclude?.find(x => typeof x === "string" ? x === member.uuid : x.uuid === member.uuid)
		);
	}
</script>

<template>
	<IonModal class="member-select-modal" :breakpoints="[0,0.75,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ props.customTitle ?? $t("members:select") }}</IonTitle>
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
		</IonHeader>

		<SpinnerFullscreen v-if="!members" />
		<IonContent v-else>
			<TheresNothingHere v-if="!members.length" />
			<IonList v-else>
				<VirtualList :entries="members" :min-size="86" :gap="2">
					<template #default="{ entry: member }">
						<MemberItem
							:key="member.uuid"
							button
							:member
							show-archived
							:show-role="!accessibilityConfig.compactLists"
							:show-pronouns="!accessibilityConfig.compactLists"
							:smaller-avatar="accessibilityConfig.compactLists"
							:disabled="isDisabled(member)"
							has-toggle="checkbox"
							:toggle-value="member.uuid"
							:toggle-checked="!!selectedMembers.find(x => x.uuid === member.uuid)"
							@toggle-update="value => check(member, value)"
						/>
					</template>
				</VirtualList>
			</IonList>

			<InfiniteLoader v-if="!iterDone" @infinite="pollMembers" />

			<IonFab
				v-if="!props.hideFab && !props.discardOnSelect"
				slot="fixed"
				vertical="bottom"
				horizontal="end"
			>
				<IonFabButton @click="modalController.dismiss('confirm')">
					<IonIcon :icon="checkMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	:deep(ion-checkbox::part(container)) {
		visibility: v-bind("!props.hideCheckboxes ? 'visible' : 'hidden'")
	}
</style>