<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonList,
		IonModal
	} from "@ionic/vue";

	import { onBeforeMount, shallowRef } from "vue";
	import type { FrontingEntry, FrontingEntryComplete } from "../lib/db/entities";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import FrontingEntryItem from "../components/frontingEntry/FrontingEntryItem.vue";
	import VirtualList from "../components/VirtualList.vue";
	import { toFrontingEntryComplete } from "../lib/db/tables/frontingEntries";

	const props = defineProps<{
		entries: FrontingEntry[]
	}>();

	const complete = shallowRef<FrontingEntryComplete[]>();

	onBeforeMount(async () => {
		complete.value = await Promise.all(
			props.entries.map(x => toFrontingEntryComplete(x))
		);
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
