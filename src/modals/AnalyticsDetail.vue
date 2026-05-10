<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonList,
		IonModal
	} from "@ionic/vue";

	import { onMounted, shallowRef } from "vue";
	import type { FrontingEntry, FrontingEntryComplete } from "../lib/db/entities";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import FrontingEntryItem from "../components/frontingEntry/FrontingEntryItem.vue";
	import VirtualList from "../components/VirtualList.vue";
	import { defaultMember, getMember } from "../lib/db/tables/members";

	const props = defineProps<{
		entries: FrontingEntry[]
	}>();

	const complete = shallowRef<FrontingEntryComplete[]>();

	onMounted(async () => {
		const _memberSet = await Promise.all(Array.from(new Set(props.entries.map(x => [x.member, x.influencing].filter((x): x is string => !!x)).flat(1))).map(x => getMember(x)));
		complete.value = props.entries.map(x => ({
			...x,
			member: _memberSet.find(y => y.uuid === x.member) || defaultMember(),
			influencing: x.influencing ? _memberSet.find(y => y.uuid === x.influencing) : undefined
		}));
	});
</script>

<template>
	<IonModal class="analytics-detail-modal" :breakpoints="[0,0.75,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("analytics:detail") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!complete" />
		<IonContent v-else>
			<IonList>
				<VirtualList :entries="complete" :min-size="86" :gap="2">
					<template #default="{ entry }">
						<FrontingEntryItem :entry="entry" :show-effects="false" :presence-average="true" />
					</template>
				</VirtualList>
			</IonList>
		</IonContent>
	</IonModal>
</template>
