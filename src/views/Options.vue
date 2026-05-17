<script setup lang="ts">
	import { IonContent, IonFab, IonFabButton, IonList, IonItem, IonListHeader, IonLabel, IonPage, IonTitle, IonToolbar, IonIcon, useIonRouter } from "@ionic/vue";
	import { inject } from "vue";
	import CollapsibleHeaderbar from "../components/CollapsibleHeaderbar.vue";

	import LockMD from "@material-symbols/svg-600/rounded/lock.svg";
	import TestingMD from "@material-symbols/svg-600/rounded/taunt.svg";
	import SettingsMD from "@material-symbols/svg-600/rounded/settings.svg";
	import AccessibilityMD from "@material-symbols/svg-600/rounded/accessibility_new.svg";
	import ImportExportMD from "@material-symbols/svg-600/rounded/swap_vert.svg";
	import AboutMD from "@material-symbols/svg-600/rounded/info.svg";
	import ResourcesMD from "@material-symbols/svg-600/rounded/menu_book.svg";

	import { appConfig, securityConfig } from "../lib/config";
	import { lock } from "../lib/applock";
	import { lists } from "../router/lists";

	const router = useIonRouter();
	const isDev = inject<boolean>("isDev");
	
	function lockImmediately(){
		if(lock())
			router.replace("/lock");
	}

	function notInTab(which: string){
		return !appConfig.tabOrder.includes(which);
	}
</script>

<template>
	<IonPage>
		<IonContent>
			<CollapsibleHeaderbar class="size-large">
				<IonToolbar>
					<IonTitle>
						{{ $t("options:header") }}
					</IonTitle>
				</IonToolbar>
			</CollapsibleHeaderbar>

			<IonListHeader>
				<IonLabel>{{ $t("options:managementLabel") }}</IonLabel>
			</IonListHeader>

			<IonList>

				<IonItem
					v-for="pair in Object.entries(lists).filter(x => notInTab(x[0]))"
					:key="pair[0]"
					button
					:router-link="`/lists/${pair[0]}`"
				>
					<IonIcon slot="start" :icon="pair[1].icon" aria-hidden="true" />
					<IonLabel>{{ $t(`${pair[0]}:header`) }}</IonLabel>
				</IonItem>

			</IonList>

			<IonListHeader>
				<IonLabel>{{ $t("options:settingsLabel") }}</IonLabel>
			</IonListHeader>

			<IonList>

				<IonItem button router-link="/options/appSettings">
					<IonIcon slot="start" :icon="SettingsMD" aria-hidden="true" />
					<IonLabel>{{ $t("appSettings:header") }}</IonLabel>
				</IonItem>

				<IonItem button router-link="/options/security">
					<IonIcon slot="start" :icon="LockMD" aria-hidden="true" />
					<IonLabel>{{ $t("security:header") }}</IonLabel>
				</IonItem>

				<IonItem button router-link="/options/accessibility">
					<IonIcon slot="start" :icon="AccessibilityMD" aria-hidden="true" />
					<IonLabel>{{ $t("accessibility:header") }}</IonLabel>
				</IonItem>

				<IonItem button router-link="/options/importExport">
					<IonIcon slot="start" :icon="ImportExportMD" aria-hidden="true" />
					<IonLabel>{{ $t("importExport:header") }}</IonLabel>
				</IonItem>

				<IonItem button router-link="/options/resources">
					<IonIcon slot="start" :icon="ResourcesMD" aria-hidden="true" />
					<IonLabel>{{ $t("resources:header") }}</IonLabel>
				</IonItem>

				<IonItem button router-link="/options/about">
					<IonIcon slot="start" :icon="AboutMD" aria-hidden="true" />
					<IonLabel>{{ $t("about:header") }}</IonLabel>
				</IonItem>

			</IonList>

			<template v-if="isDev">
				<IonListHeader>{{ $t("other:developerMode") }}</IonListHeader>
				<IonList>
					<IonItem button router-link="/options/testingGrounds">
						<IonIcon slot="start" :icon="TestingMD" aria-hidden="true" />
						Testing grounds
					</IonItem>
				</IonList>
			</template>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="securityConfig.password" @click="lockImmediately">
					<IonIcon :icon="LockMD" />
				</IonFabButton>

			</IonFab>
		</IonContent>
	</IonPage>
</template>
