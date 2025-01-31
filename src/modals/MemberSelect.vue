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

	import { inject, onBeforeMount, onUnmounted, reactive, ref, shallowRef, watch } from "vue";
	import { getFilteredMembers } from "../lib/search.ts";
	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import MemberLabel from "../components/member/MemberLabel.vue";
	import type { Member } from "../lib/db/entities.d.ts";
	import { getMembers } from "../lib/db/tables/members";
	import { DatabaseEvents, DatabaseEvent } from '../lib/db/events';
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";

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
	const filteredMembers = shallowRef<Member[]>();

	const listener = async (event: Event) => {
		if((event as DatabaseEvent).data.table == "members")
			members.value = await getMembers();
	}

	watch(selectedMembers, () => {
		emit("update:modelValue", selectedMembers);
	});

	watch([search, members], async () => {
		filteredMembers.value = await getFilteredMembers(search.value, members.value);
	}, { immediate: true });

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		members.value = await getMembers();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	function check(member: Member, checked: boolean){
		if(checked){
			if(props.onlyOne)
				selectedMembers.length = 0;
			selectedMembers.push(member);
		} else {
			const index = selectedMembers.indexOf(member);
			if(index > -1)
				selectedMembers.splice(index, 1);
		}

		if(props.onlyOne && props.discardOnSelect){
			modalController.dismiss();
		}
	}
</script>

<template>
	<IonModal class="member-select-modal" :breakpoints="[0,0.25,0.75,1]" initialBreakpoint="0.75">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ props.customTitle ?? $t("other:memberSelect.header") }}</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('members:searchPlaceholder')"
					showCancelButton="focus" showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!members" />
		<IonContent v-else>
			<IonList :inset="isIOS">
				<IonItem button v-for="member in filteredMembers" :key="member.uuid">
					<MemberAvatar slot="start" :member />
					<IonCheckbox :value="member.uuid" :checked="!!selectedMembers.find(x => x.uuid === member.uuid)" @update:modelValue="value => check(member, value)">
						<MemberLabel :member />
					</IonCheckbox>
				</IonItem>
			</IonList>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.member-select-modal {
		--height: 100dvh;
		--border-radius: 16px;
	}

	ion-checkbox::part(container) {
		visibility: v-bind("!props.hideCheckboxes ? 'visible' : 'hidden'")
	}
</style>