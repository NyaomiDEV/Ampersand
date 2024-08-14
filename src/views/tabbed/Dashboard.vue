<script setup lang="ts">
	import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, onIonViewWillEnter, onIonViewWillLeave } from '@ionic/vue';
	import { inject, ref, watch, WatchStopHandle } from 'vue';
	import { getFrontingEntriesTable, getMainFronter } from '../../lib/db/entities/frontingEntries';
	import { Member } from '../../lib/db/entities/members';
	import { useObservable } from '@vueuse/rxjs';
	import { from } from 'rxjs';
	import { liveQuery } from 'dexie';

	import CurrentFrontersCarousel from '../../components/dashboard/CurrentFrontersCarousel.vue';
	import MessageBoardCarousel from '../../components/dashboard/MessageBoardCarousel.vue';
	import FrontingHistoryCarousel from '../../components/dashboard/FrontingHistoryCarousel.vue';

	const mainFronter = ref<Member>();

	let handle: WatchStopHandle;
	onIonViewWillEnter(() => {
		handle = watch(
			useObservable(from(liveQuery(() => getFrontingEntriesTable().toArray()))),
			async () => {
				mainFronter.value = await getMainFronter();
			},
			{ immediate: true }
		);
	});
	onIonViewWillLeave(() => handle());


	const isIOS = inject<boolean>("isIOS");
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
