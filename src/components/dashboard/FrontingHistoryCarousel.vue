<script setup lang="ts">
	import { IonList, IonListHeader, IonLabel } from "@ionic/vue";
	import { onBeforeMount, onUnmounted, shallowRef } from "vue";
	import type { FrontingEntryComplete } from "../../lib/db/entities.d.ts";
	import { getRecentlyFronted, toFrontingEntryComplete } from "../../lib/db/tables/frontingEntries";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";

	import FrontingEntryItem from "../frontingEntry/FrontingEntryItem.vue";
	import { appConfig } from "../../lib/config/index.ts";

	const frontingEntries = shallowRef<FrontingEntryComplete[]>();

	async function updateFrontingEntries(){
		frontingEntries.value = await toFrontingEntryComplete(await getRecentlyFronted(appConfig.dashboardSettings.frontingHistoryCarousel.settings.maxDays));
	}

	const listener = (event: Event) => {
		if(["members", "frontingEntries"].includes((event as DatabaseEvent).data.table))
			void updateFrontingEntries();
	};

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await updateFrontingEntries();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});
</script>

<template>
	<IonListHeader v-if="frontingEntries && frontingEntries.length">
		<IonLabel>{{ $t("dashboard:recentFrontingHistory") }}</IonLabel>
	</IonListHeader>

	<IonList v-if="frontingEntries">
		<FrontingEntryItem
			v-for="entry in frontingEntries"
			:key="entry.uuid"
			button
			:entry
			show-date-complete
			:router-link="`/edit/frontingEntry?uuid=${entry.uuid}`"
		/>
	</IonList>
</template>
