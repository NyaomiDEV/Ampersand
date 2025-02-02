<script setup lang="ts">
	import { IonContent, IonHeader, IonFab, IonFabButton, IonList, IonItem, IonListHeader, IonLabel, IonPage, IonTitle, IonToolbar, IonIcon, useIonRouter } from '@ionic/vue';
	import { inject } from 'vue';
	import { wasPersisted } from '../lib/util/storageManager';
	import StoragePersistenceMissing from "../components/StoragePersistenceMissing.vue";

	import {
		lockClosedOutline as LockIOS,
		personOutline as SystemIOS,
		analyticsOutline as FrontHistoryIOS,
		newspaperOutline as MessageBoardIOS,
		pricetagOutline as TagIOS,
		notificationsOutline as RemindersIOS,
		cog as SettingsIOS,
		accessibilityOutline as AccessibilityIOS,
		swapVerticalOutline as ImportExportIOS,
		informationCircleOutline as AboutIOS,
		sparklesOutline as SparklesIOS,
		folderOpenOutline as FolderIOS
	} from "ionicons/icons";

	import LockMD from '@material-symbols/svg-600/outlined/lock.svg';
	import SparklesMD from '@material-symbols/svg-600/outlined/star.svg';
	import SystemMD from '@material-symbols/svg-600/outlined/person.svg';
	import FrontHistoryMD from '@material-symbols/svg-600/outlined/show_chart.svg';
	import MessageBoardMD from '@material-symbols/svg-600/outlined/newspaper.svg';
	import TagMD from '@material-symbols/svg-600/outlined/label.svg';
	import RemindersMD from '@material-symbols/svg-600/outlined/notification_add.svg';
	import SettingsMD from '@material-symbols/svg-600/outlined/settings.svg';
	import AccessibilityMD from '@material-symbols/svg-600/outlined/accessibility_new.svg';
	import ImportExportMD from '@material-symbols/svg-600/outlined/swap_vert.svg';
	import AboutMD from '@material-symbols/svg-600/outlined/info.svg';
	import FolderMD from '@material-symbols/svg-600/outlined/folder_open.svg';
	import { securityConfig } from '../lib/config';
	import { lock } from '../lib/applock';
	import { isTauri } from '../lib/mode';

	const router = useIonRouter();
	const isIOS = inject<boolean>("isIOS");

	const isDev = import.meta.env.MODE === 'development';

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
					{{ $t("options:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>

			<StoragePersistenceMissing v-if="!wasPersisted" />

			<IonListHeader>
				<IonLabel>{{ $t("options:managementLabel") }}</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS">

				<IonItem button routerLink="/options/systemSettings">
					<IonIcon :ios="SystemIOS" :md="SystemMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("systemSettings:header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/frontHistory">
					<IonIcon :ios="FrontHistoryIOS" :md="FrontHistoryMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("frontHistory:header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/messageBoard">
					<IonIcon :ios="MessageBoardIOS" :md="MessageBoardMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("messageBoard:header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/tagManagement">
					<IonIcon :ios="TagIOS" :md="TagMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("tagManagement:header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/assetManager">
					<IonIcon :ios="FolderIOS" :md="FolderMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("assetManager:header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/reminders" v-if="isDev || isTauri()">
					<IonIcon :ios="RemindersIOS" :md="RemindersMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("reminders:header") }}</IonLabel>
				</IonItem>

			</IonList>

			<IonListHeader>
				<IonLabel>{{ $t("options:settingsLabel") }}</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS">

				<IonItem button routerLink="/options/appSettings">
					<IonIcon :ios="SettingsIOS" :md="SettingsMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("appSettings:header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/security">
					<IonIcon :ios="LockIOS" :md="LockMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("security:header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/accessibility">
					<IonIcon :ios="AccessibilityIOS" :md="AccessibilityMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("accessibility:header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/importExport">
					<IonIcon :ios="ImportExportIOS" :md="ImportExportMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("importExport:header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/about">
					<IonIcon :ios="AboutIOS" :md="AboutMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("about:header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/testingGrounds" v-if="isDev">
					<IonIcon :ios="SparklesIOS" :md="SparklesMD" slot="start" aria-hidden="true" />
					Testing grounds
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="securityConfig.password && securityConfig.usePassword" @click="lockImmediately">
					<IonIcon :ios="LockIOS" :md="LockMD" />
				</IonFabButton>

			</IonFab>
		</IonContent>
	</IonPage>
</template>
