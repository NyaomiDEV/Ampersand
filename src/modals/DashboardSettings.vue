<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonList,
		IonButton,
		IonButtons,
		IonLabel,
		IonItem,
		IonModal,
		IonReorderGroup,
		IonReorder,
		IonListHeader,
		IonToggle
	} from "@ionic/vue";

	import { ref } from "vue";

	import reorderMD from "@material-symbols/svg-600/outlined/swap_vert.svg";
	import doneMD from "@material-symbols/svg-600/outlined/done_all.svg";
	import dragMD from "@material-symbols/svg-600/outlined/drag_handle.svg";
	import { appConfig } from "../lib/config";
	import MessageBoardSettings from "../components/dashboard/settings/MessageBoardSettings.vue";
	import FrontingHistorySettings from "../components/dashboard/settings/FrontingHistorySettings.vue";
	import CurrentFrontersSettings from "../components/dashboard/settings/CurrentFrontersSettings.vue";

	const isReordering = ref(false);
	const settings = ref(Object.entries(appConfig.dashboardSettings).sort((a, b) => a[1].priority - b[1].priority).map(([key, v]) => [key, v.priority]));

	const fragments = {
		messageBoardCarousel: MessageBoardSettings,
		frontingHistoryCarousel: FrontingHistorySettings,
		currentFrontersCarousel: CurrentFrontersSettings
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function handleReorder(e: any){
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		e.detail.complete();
		if(e.detail.from === e.detail.to) return;

		const element = settings.value[e.detail.from];
		settings.value.splice(e.detail.from, 1);
		settings.value.splice(e.detail.to, 0, element);

		for(const key in appConfig.dashboardSettings){
			const oldPriority = appConfig.dashboardSettings[key].priority;
			const newPriority = settings.value.findIndex(x => x[0] === key);
			if(oldPriority === newPriority) continue;

			appConfig.dashboardSettings[key].priority = newPriority;
			if(newPriority !== appConfig.dashboardSettings[key].priority) console.log(key, appConfig.dashboardSettings[key], newPriority);
		}
	}
</script>

<template>
	<IonModal class="dashboard-settings-modal" :breakpoints="[0,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("appSettings:dashboard.title") }}</IonTitle>
				<IonButtons slot="secondary">
					<IonButton @click="isReordering = !isReordering">
						<IonIcon slot="icon-only" :icon="isReordering ? doneMD : reorderMD" />
					</IonButton>
				</IonButtons>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList v-if="isReordering">
				<IonReorderGroup :disabled="false" @ion-reorder-end="handleReorder">
					<IonItem v-for="item in settings" :key="item[1]">
						<IonLabel>{{ $t(`appSettings:dashboard.${item[0]}.title`) }}</IonLabel>
						<IonReorder slot="end">
							<IonIcon :icon="dragMD" />
						</IonReorder>
					</IonItem>
				</IonReorderGroup>
			</IonList>
			<template v-for="item in settings" v-else :key="item[1]">
				<IonListHeader>
					{{ $t(`appSettings:dashboard.${item[0]}.title`) }}
				</IonListHeader>
				<IonList>
					<IonItem button :detail="false">
						<IonToggle v-model="appConfig.dashboardSettings[item[0]].active">
							<IonLabel>
								{{ $t("appSettings:dashboard.active") }}
							</IonLabel>
						</IonToggle>
					</IonItem>
					<component :is="fragments[item[0]]" v-if="fragments[item[0]]" />
				</IonList>
			</template>
		</IonContent>
	</IonModal>
</template>
