<script setup lang="ts">
	import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
	import { onBeforeMount, onUnmounted, ref } from 'vue';
	import { getMainFronter } from '../../lib/db/tables/frontingEntries';
	import type { Member } from '../../lib/db/entities.d.ts';

	import CurrentFrontersCarousel from '../../components/dashboard/CurrentFrontersCarousel.vue';
	import MessageBoardCarousel from '../../components/dashboard/MessageBoardCarousel.vue';
	import FrontingHistoryCarousel from '../../components/dashboard/FrontingHistoryCarousel.vue';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';
	const mainFronter = ref<Member>();

	const listener = async (event: Event) => {
		if((event as DatabaseEvent).data.table === "frontingEntries")
			mainFronter.value = await getMainFronter();
	}
	
	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		mainFronter.value = await getMainFronter();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonTitle>
					{{ 
						mainFronter
						? $t("dashboard:header_mainfronter", { fronterName: mainFronter.name })
						: $t("dashboard:header_salute") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<CurrentFrontersCarousel />
			<MessageBoardCarousel />
			<FrontingHistoryCarousel />
		</IonContent>
	</IonPage>
</template>
