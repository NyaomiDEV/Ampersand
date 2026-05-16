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
	import { toFrontingEntryComplete } from "../lib/db/tables/frontingEntries";
	import TheresNothingHere from "../components/TheresNothingHere.vue";

	const props = defineProps<{
		entries: FrontingEntry[]
	}>();

	const complete = shallowRef<FrontingEntryComplete[]>();

	onMounted(async () => {
		complete.value = await toFrontingEntryComplete(props.entries);
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
			<TheresNothingHere v-if="!complete.length" />
			<IonList v-else>
				<VirtualList :entries="complete" :min-size="86" :gap="2">
					<template #default="{ entry }">
						<FrontingEntryItem
							:entry="entry"
							:show-effects="false"
							show-date-complete
							:presence-average="true"
						/>
					</template>
				</VirtualList>
			</IonList>
		</IonContent>
	</IonModal>
</template>
