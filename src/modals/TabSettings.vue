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
		IonToggle
	} from "@ionic/vue";

	import { lists } from "../router/lists";

	import dragMD from "@material-symbols/svg-600/rounded/drag_handle.svg";
	import resetMD from "@material-symbols/svg-600/rounded/restart_alt.svg";
	import HomeMD from "@material-symbols/svg-600/rounded/home.svg";

	import { defaultAppConfig, appConfig } from "../lib/config";
	import { useTranslation } from "i18next-vue";

	const i18next = useTranslation();

	const allAvailable = ["dashboard", ...Object.keys(lists)]
		.sort((a, b) => i18next.t(`${a}:header`).localeCompare(i18next.t(`${b}:header`)));

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function handleReorder(e: any){
		if(e.detail.from === e.detail.to){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			e.detail.complete();
			return;
		}

		const element = appConfig.tabOrder[e.detail.from];
		const _tabOrder = [...appConfig.tabOrder];
		_tabOrder.splice(e.detail.from, 1);
		_tabOrder.splice(e.detail.to, 0, element);
		appConfig.tabOrder = _tabOrder;

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		e.detail.complete();
	}

	function restoreDefaultOrdering(){
		appConfig.tabOrder = defaultAppConfig.tabOrder;
	}

	function getIcon(name: string){
		switch(name){
			case "dashboard":
				return HomeMD;
			default:
				return name in lists ? lists[name].icon : undefined;
		}
	}
</script>

<template>
	<IonModal class="tab-settings-modal" :breakpoints="[0,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("appSettings:tabSettings") }}</IonTitle>
				<IonButtons slot="secondary">
					<IonButton @click="restoreDefaultOrdering">
						<IonIcon slot="icon-only" :icon="resetMD" />
					</IonButton>
				</IonButtons>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList>
				<IonReorderGroup :disabled="false" @ion-reorder-end="handleReorder">
					<IonItem v-for="item in appConfig.tabOrder" :key="item">
						<IonIcon slot="start" :icon="getIcon(item)" aria-hidden="true" />
						<IonLabel>{{ $t(`${item}:header`) }}</IonLabel>
						<IonToggle
							v-if="item !== 'dashboard'"
							slot="end"
							checked
							@ion-change="appConfig.tabOrder.splice(appConfig.tabOrder.indexOf(item), 1)"
						/>
						<IonReorder slot="end">
							<IonIcon :icon="dragMD" />
						</IonReorder>
					</IonItem>
				</IonReorderGroup>
			</IonList>

			<IonList>
				<IonItem v-for="item in allAvailable.filter(x => !appConfig.tabOrder.includes(x))" :key="item">
					<IonIcon slot="start" :icon="getIcon(item)" aria-hidden="true" />
					<IonLabel>{{ $t(`${item}:header`) }}</IonLabel>
					<IonToggle slot="end" @ion-change="appConfig.tabOrder.push(item)" />
				</IonItem>
			</IonList>
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