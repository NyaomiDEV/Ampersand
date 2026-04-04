<script setup lang="ts">
	import { IonContent, IonFab, IonFabButton, IonList, IonItem, IonListHeader, IonLabel, IonPage, IonTitle, IonToolbar, IonIcon, useIonRouter } from "@ionic/vue";
	import { inject } from "vue";
	import CollapsibleHeaderbar from "../components/CollapsibleHeaderbar.vue";

	import LockMD from "@material-symbols/svg-600/outlined/lock.svg";
	import TestingMD from "@material-symbols/svg-600/outlined/taunt.svg";
	import SystemMD from "@material-symbols/svg-600/outlined/groups.svg";
	import FrontHistoryMD from "@material-symbols/svg-600/outlined/show_chart.svg";
	import MessageBoardMD from "@material-symbols/svg-600/outlined/newspaper.svg";
	import TagMD from "@material-symbols/svg-600/outlined/sell.svg";
	import RemindersMD from "@material-symbols/svg-600/outlined/notification_add.svg";
	import SettingsMD from "@material-symbols/svg-600/outlined/settings.svg";
	import AccessibilityMD from "@material-symbols/svg-600/outlined/accessibility_new.svg";
	import ImportExportMD from "@material-symbols/svg-600/outlined/swap_vert.svg";
	import AboutMD from "@material-symbols/svg-600/outlined/info.svg";
	import FolderMD from "@material-symbols/svg-600/outlined/folder_open.svg";
	import CustomFieldsMD from "@material-symbols/svg-600/outlined/format_list_bulleted_add.svg";
	import ResourcesMD from "@material-symbols/svg-600/outlined/menu_book.svg";

	import { securityConfig } from "../lib/config";
	import { lock } from "../lib/applock";

	const router = useIonRouter();
	const isDev = inject<boolean>("isDev");
	const isDevServer = inject<boolean>("isDevServer");
	
	function lockImmediately(){
		if(lock())
			router.replace("/lock");
	}
</script>

<template>
	<IonPage>
		<IonContent :scroll-events="true">
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

				<IonItem button router-link="/options/systems">
					<IonIcon slot="start" :icon="SystemMD" aria-hidden="true" />
					<IonLabel>{{ $t("systems:header") }}</IonLabel>
				</IonItem>

				<IonItem button router-link="/options/customFields">
					<IonIcon slot="start" :icon="CustomFieldsMD" aria-hidden="true" />
					<IonLabel>{{ $t("customFields:header") }}</IonLabel>
				</IonItem>

				<IonItem button router-link="/options/frontHistory">
					<IonIcon slot="start" :icon="FrontHistoryMD" aria-hidden="true" />
					<IonLabel>{{ $t("frontHistory:header") }}</IonLabel>
				</IonItem>

				<IonItem button router-link="/options/messageBoard">
					<IonIcon slot="start" :icon="MessageBoardMD" aria-hidden="true" />
					<IonLabel>{{ $t("messageBoard:header") }}</IonLabel>
				</IonItem>

				<IonItem button router-link="/options/tagManagement">
					<IonIcon slot="start" :icon="TagMD" aria-hidden="true" />
					<IonLabel>{{ $t("tagManagement:header") }}</IonLabel>
				</IonItem>

				<IonItem button router-link="/options/assetManager">
					<IonIcon slot="start" :icon="FolderMD" aria-hidden="true" />
					<IonLabel>{{ $t("assetManager:header") }}</IonLabel>
				</IonItem>

				<IonItem v-if="isDevServer" button router-link="/options/reminders">
					<IonIcon slot="start" :icon="RemindersMD" aria-hidden="true" />
					<IonLabel>{{ $t("reminders:header") }}</IonLabel>
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
				<IonFabButton v-if="securityConfig.password && securityConfig.usePassword" @click="lockImmediately">
					<IonIcon :icon="LockMD" />
				</IonFabButton>

			</IonFab>
		</IonContent>
	</IonPage>
</template>
