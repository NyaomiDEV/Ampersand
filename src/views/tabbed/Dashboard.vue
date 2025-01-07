<script setup lang="ts">
	import { IonContent, IonHeader, useIonRouter, IonFab, IonIcon, IonFabButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
	import { onBeforeMount, onUnmounted, ref } from 'vue';
	import { getMainFronter } from '../../lib/db/tables/frontingEntries';
	import type { Member } from '../../lib/db/entities.d.ts';

	import { lockClosedOutline as LockIOS } from "ionicons/icons";

	import LockMD from '@material-design-icons/svg/outlined/lock.svg';

	import CurrentFrontersCarousel from '../../components/dashboard/CurrentFrontersCarousel.vue';
	import MessageBoardCarousel from '../../components/dashboard/MessageBoardCarousel.vue';
	import FrontingHistoryCarousel from '../../components/dashboard/FrontingHistoryCarousel.vue';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';
	import { securityConfig } from '../../lib/config';
	import { lock } from '../../lib/applock';

	const mainFronter = ref<Member>();
	const router = useIonRouter();

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

	function lockImmediately(){
		if(lock())
			router.replace("/lock");
	}

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

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="securityConfig.password && securityConfig.usePassword" @click="lockImmediately">
					<IonIcon :ios="LockIOS" :md="LockMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>
