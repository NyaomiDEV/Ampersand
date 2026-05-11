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

	import { ref, toRaw } from "vue";

	import reorderMD from "@material-symbols/svg-600/rounded/swap_vert.svg";
	import doneMD from "@material-symbols/svg-600/rounded/done_all.svg";
	import dragMD from "@material-symbols/svg-600/rounded/drag_handle.svg";
	import resetMD from "@material-symbols/svg-600/rounded/restart_alt.svg";

	import { defaultAppConfig, appConfig } from "../lib/config";
	import MessageBoardSettings from "../components/dashboard/settings/MessageBoardSettings.vue";
	import FrontingHistorySettings from "../components/dashboard/settings/FrontingHistorySettings.vue";
	import CurrentFrontersSettings from "../components/dashboard/settings/CurrentFrontersSettings.vue";
	import JournalPostSettings from "../components/dashboard/settings/JournalPostSettings.vue";

	const isReordering = ref(false);
	const settings = ref(getSettings());

	const fragments = {
		messageBoardCarousel: MessageBoardSettings,
		frontingHistoryCarousel: FrontingHistorySettings,
		currentFrontersCarousel: CurrentFrontersSettings,
		journalPostCarousel: JournalPostSettings
	};

	function getSettings(){
		const _settings = appConfig.dashboardSettings;
		const _array: [string, number][] = [];

		for(const setting of Object.keys(_settings)){
			const priority = _settings[setting].priority;
			_array.push([setting, priority]);
		}

		_array.sort((a, b) => a[1] - b[1]);
		return _array;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function handleReorder(e: any){
		if(e.detail.from === e.detail.to){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			e.detail.complete();
			return;
		}

		const element = settings.value[e.detail.from];
		const _settings = [...toRaw(settings.value)];
		_settings.splice(e.detail.from, 1);
		_settings.splice(e.detail.to, 0, element);

		for(const key of Object.keys(appConfig.dashboardSettings)){
			const oldPriority = appConfig.dashboardSettings[key].priority;
			const newPriority = _settings.findIndex(x => x[0] === key);
			if(oldPriority === newPriority || newPriority < 0) continue;

			appConfig.dashboardSettings[key].priority = newPriority;
		}

		settings.value = getSettings();

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		e.detail.complete();
	}

	function restoreDefaultOrdering(){
		for(const key of Object.keys(appConfig.dashboardSettings)){
			const oldPriority = appConfig.dashboardSettings[key].priority;
			const newPriority = defaultAppConfig.dashboardSettings[key].priority;
			if(oldPriority === newPriority) continue;

			appConfig.dashboardSettings[key].priority = newPriority;
		}

		settings.value = getSettings();
	}
</script>

<template>
	<IonModal class="dashboard-settings-modal" :breakpoints="[0,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("appSettings:dashboard.title") }}</IonTitle>
				<IonButtons slot="secondary">
					<IonButton v-if="isReordering" @click="restoreDefaultOrdering">
						<IonIcon slot="icon-only" :icon="resetMD" />
					</IonButton>
					<IonButton @click="isReordering = !isReordering">
						<IonIcon slot="icon-only" :icon="isReordering ? doneMD : reorderMD" />
					</IonButton>
				</IonButtons>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList v-if="isReordering">
				<IonReorderGroup :disabled="false" @ion-reorder-end="handleReorder">
					<IonItem v-for="item in settings" :key="item[0]">
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

<style scoped>
	ion-reorder > ion-icon {
		width: 24px;
		height: 24px;
		color: rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.54);
	}
</style>