<script setup lang="ts">
	import { IonContent, IonHeader, useIonRouter, IonFab, IonIcon, IonFabButton, IonPage, IonTitle, IonToolbar } from "@ionic/vue";
	import { onBeforeMount, onUnmounted, shallowRef } from "vue";
	import { getMainFronter } from "../lib/db/tables/frontingEntries.ts";
	import type { Member } from "../lib/db/entities";

	import LockMD from "@material-symbols/svg-600/outlined/lock.svg";

	import SystemDescriptionAccordion from "../components/dashboard/SystemDescriptionAccordion.vue";
	import CurrentFrontersCarousel from "../components/dashboard/CurrentFrontersCarousel.vue";
	import MessageBoardCarousel from "../components/dashboard/MessageBoardCarousel.vue";
	import FrontingHistoryCarousel from "../components/dashboard/FrontingHistoryCarousel.vue";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events.ts";
	import { appConfig, securityConfig } from "../lib/config/index.ts";
	import { lock } from "../lib/applock.ts";

	const mainFronter = shallowRef<Member>();
	const router = useIonRouter();

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "frontingEntries")
			void getMainFronter().then(res => mainFronter.value = res);
	};
	
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
			<SystemDescriptionAccordion v-if="appConfig.showSystemDescriptionInDashboard" />
			<CurrentFrontersCarousel />
			<MessageBoardCarousel />
			<FrontingHistoryCarousel />

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="securityConfig.password && securityConfig.usePassword" @click="lockImmediately">
					<IonIcon :icon="LockMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>
