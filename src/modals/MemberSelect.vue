<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonList,
		IonItem,
		IonModal,
		IonSearchbar,
		IonCheckbox,
		modalController,
	} from "@ionic/vue";

	import { inject, onBeforeMount, onUnmounted, reactive, ref, shallowRef, toRaw, watch } from "vue";
	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import MemberLabel from "../components/member/MemberLabel.vue";
	import type { Member } from "../lib/db/entities.d.ts";
	import { getFilteredMembers } from "../lib/db/tables/members";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import { appConfig } from "../lib/config/index.ts";

	const isIOS = inject<boolean>("isIOS");

	const props = defineProps<{
		customTitle?: string,
		onlyOne?: boolean,
		discardOnSelect?: boolean,
		modelValue?: Member[],
		hideCheckboxes?: boolean
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

	watch(selectedMembers, () => {
		emit("update:modelValue", [...toRaw(selectedMembers)]);
	});

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
					if(props.discardOnSelect)
						void modalController.dismiss();
					return;
				}
				selectedMembers.splice(index, 1);
			}
		}

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
					@ion-change="e => search = e.detail.value || ''"
				/>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!members" />
		<IonContent v-else>
			<IonList :inset="isIOS">
				<IonItem v-for="member in members" :key="member.uuid" button>
					<MemberAvatar slot="start" :member />
					<IonCheckbox :value="member.uuid" :checked="!!selectedMembers.find(x => x.uuid === member.uuid)" @update:model-value="value => check(member, value)">
						<MemberLabel :member />
					</IonCheckbox>
				</IonItem>
			</IonList>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-checkbox::part(container) {
		visibility: v-bind("!props.hideCheckboxes ? 'visible' : 'hidden'")
	}
</style>