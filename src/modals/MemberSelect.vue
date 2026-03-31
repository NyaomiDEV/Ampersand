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
	} from "@ionic/vue";

	import { onBeforeMount, onUnmounted, reactive, ref, shallowRef, toRaw, watch } from "vue";
	import type { Member } from "../lib/db/entities.d.ts";
	import { getFilteredMembers } from "../lib/db/tables/members";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import VirtualList from "../components/VirtualList.vue";

	import MemberItem from "../components/member/MemberItem.vue";

	const props = defineProps<{
		customTitle?: string,
		onlyOne?: boolean,
		alwaysEmit?: boolean,
		discardOnSelect?: boolean,
		modelValue?: Member[],
		hideCheckboxes?: boolean,
		membersToExclude?: Member[],
		membersToInclude?: Member[]
	}>();

	const emit = defineEmits<{
		"update:modelValue": [Member[]],
	}>();

	const selectedMembers = reactive<Member[]>([...props.modelValue || []]);
	const search = ref("");
	const members = shallowRef<Member[]>();

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "members")
			void Array.fromAsync(getFilteredMembers(search.value)).then(res => members.value = res);
	};

	watch(search, async () => {
		await updateMembers();
	});
	
	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await updateMembers();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function updateMembers(){
		members.value = await Array.fromAsync(getFilteredMembers(search.value));
	}

	function check(member: Member, checked: boolean){
		// hideCheckboxes implies onlyOne
		const onlyOne = props.onlyOne || props.hideCheckboxes;
		if(checked){
			if(onlyOne)
				selectedMembers.length = 0;
			selectedMembers.push(member);
		} else {
			const index = selectedMembers.findIndex(x => x.uuid === member.uuid);
			if(index > -1){
				if(selectedMembers.length === 1 && onlyOne){
					// selected the one who was already selected since we're in "selection mode"
					// we will just not uncheck it
					// (hideCheckboxes implies onlyOne)
					if(props.discardOnSelect){
						void modalController.dismiss();
						if(props.alwaysEmit)
							emit("update:modelValue", [...toRaw(selectedMembers)]);
					}
					return;
				}
				selectedMembers.splice(index, 1);
			}
		}

		emit("update:modelValue", [...toRaw(selectedMembers)]);

		if(onlyOne && props.discardOnSelect)
			void modalController.dismiss();
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
			<IonList>
				<VirtualList :entries="members" :min-size="86" :gap="2">
					<template #default="{ entry: member }">
						<MemberItem
							:key="member.uuid"
							button
							:member
							show-archived
							:disabled="(props.membersToInclude && !props.membersToInclude.find(x => x.uuid === member.uuid)) || !!props.membersToExclude?.find(x => x.uuid === member.uuid)"
							has-toggle="checkbox"
							:toggle-value="member.uuid"
							:toggle-checked="!!selectedMembers.find(x => x.uuid === member.uuid)"
							@toggle-update="value => check(member, value)"
						/>
					</template>
				</VirtualList>
			</IonList>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	:deep(ion-checkbox::part(container)) {
		visibility: v-bind("!props.hideCheckboxes ? 'visible' : 'hidden'")
	}
</style>