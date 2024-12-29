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
		CheckboxCustomEvent,
	} from "@ionic/vue";

	import { inject, onMounted, onUnmounted, ref, shallowRef, watch, WatchStopHandle } from "vue";
	import { getFilteredMembers } from "../lib/db/search";
	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import MemberLabel from "../components/member/MemberLabel.vue";
	import { Member } from "../lib/db/entities";
	import { getMembersTable } from "../lib/db/tables/members";
	import { from, useObservable } from "@vueuse/rxjs";
	import { liveQuery } from "dexie";

	const isIOS = inject<boolean>("isIOS");

	const props = defineProps<{
		selectedMembers: Member[],
		onlyOne?: boolean
	}>();

	const selectedMembers = props.selectedMembers;

	const emit = defineEmits<{
		selectedMembers: [Member[]]
	}>();

	function check(ev: CheckboxCustomEvent){
		if(ev.detail.checked){
			if(props.onlyOne)
				selectedMembers.length = 0;
			selectedMembers.push(filteredMembers.value?.find(x => x.uuid === ev.detail.value)!);
		}
		else {
			const index = selectedMembers.findIndex(x => x.uuid === ev.detail.value);
			if(index > -1)
				selectedMembers.splice(index, 1);
		}
	}

	function dismiss(){
		emit("selectedMembers", [...selectedMembers]);
	}

	const search = ref("");
	const members = shallowRef<Member[]>([]);
	const filteredMembers = getFilteredMembers(search, members);

	const watchStopHandlers: WatchStopHandle[] = [];

	onMounted(() => {
		watchStopHandlers.push(
			watch(
				useObservable(from(liveQuery(() => getMembersTable().toArray()))),
				async () => members.value = await getMembersTable().toArray(),
				{ immediate: true }
			)
		);
	});

	onUnmounted(() => {
		watchStopHandlers.forEach(x => x());
		watchStopHandlers.length = 0;
	});
</script>

<template>
	<IonModal class="member-select-modal" :breakpoints="[0,0.25,0.5,1]" initialBreakpoint="0.25" @willDismiss="dismiss">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("other:memberSelect.header") }}</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('members:searchPlaceholder')"
					showCancelButton="focus" showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList :inset="isIOS">
				<IonItem button v-for="member in filteredMembers" :key="JSON.stringify(member)">
					<MemberAvatar slot="start" :member />
					<IonCheckbox :value="member.uuid" :checked="!!selectedMembers.find(x => x.uuid === member.uuid)" @ionChange="check">
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
</style>