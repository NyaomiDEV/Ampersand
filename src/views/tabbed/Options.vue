<script setup lang="ts">
	import { IonContent, IonHeader, IonFab, IonFabButton, IonList, IonItem, IonListHeader, IonLabel, IonPage, IonTitle, IonToolbar, IonIcon, useIonRouter } from '@ionic/vue';
	import { inject } from 'vue';
	import { wasPersisted } from '../../lib/util/storageManager';
	import StoragePersistenceMissing from "../../components/StoragePersistenceMissing.vue";

	import {
		lockClosedOutline as LockIOS,
		personOutline as SystemIOS,
		analyticsOutline as FrontHistoryIOS,
		newspaperOutline as MessageBoardIOS,
		pricetagOutline as TagIOS,
		notificationsOutline as RemindersIOS,
		cog as SettingsIOS,
		lockClosedOutline as SecurityIOS,
		accessibilityOutline as AccessibilityIOS,
		swapVerticalOutline as ImportExportIOS,
		informationCircleOutline as AboutIOS,
		sparklesOutline as SparklesIOS,
	} from "ionicons/icons";

	import LockMD from '@material-design-icons/svg/outlined/lock.svg';
	import SparklesMD from '@material-design-icons/svg/outlined/star.svg';
	import SystemMD from '@material-design-icons/svg/outlined/person.svg';
	import FrontHistoryMD from '@material-design-icons/svg/outlined/show_chart.svg';
	import MessageBoardMD from '@material-design-icons/svg/outlined/newspaper.svg';
	import TagMD from '@material-design-icons/svg/outlined/label.svg';
	import RemindersMD from '@material-design-icons/svg/outlined/notification_add.svg';
	import SettingsMD from '@material-design-icons/svg/outlined/settings.svg';
	import SecurityMD from '@material-design-icons/svg/outlined/lock.svg';
	import AccessibilityMD from '@material-design-icons/svg/outlined/accessibility_new.svg';
	import ImportExportMD from '@material-design-icons/svg/outlined/import_export.svg';
	import AboutMD from '@material-design-icons/svg/outlined/info.svg';
	import { securityConfig } from '../../lib/config';
	import { lock } from '../../lib/applock';

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
					{{ $t("options:options.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>

			<StoragePersistenceMissing v-if="!wasPersisted" />

			<IonListHeader>
				<IonLabel>{{ $t("options:options.managementLabel") }}</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS">

				<IonItem button routerLink="/options/systemSettings">
					<IonIcon :ios="SystemIOS" :md="SystemMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("options:systemSettings.header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/frontHistory">
					<IonIcon :ios="FrontHistoryIOS" :md="FrontHistoryMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("options:frontHistory.header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/messageBoard">
					<IonIcon :ios="MessageBoardIOS" :md="MessageBoardMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("options:messageBoard.header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/tagManagement">
					<IonIcon :ios="TagIOS" :md="TagMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("options:tagManagement.header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/reminders">
					<IonIcon :ios="RemindersIOS" :md="RemindersMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("options:reminders.header") }}</IonLabel>
				</IonItem>

			</IonList>

			<IonListHeader>
				<IonLabel>{{ $t("options:options.settingsLabel") }}</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS">

				<IonItem button routerLink="/options/appSettings">
					<IonIcon :ios="SettingsIOS" :md="SettingsMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("options:appSettings.header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/security">
					<IonIcon :ios="SecurityIOS" :md="SecurityMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("options:security.header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/accessibility">
					<IonIcon :ios="AccessibilityIOS" :md="AccessibilityMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("options:accessibility.header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/importExport">
					<IonIcon :ios="ImportExportIOS" :md="ImportExportMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("options:importExport.header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/about">
					<IonIcon :ios="AboutIOS" :md="AboutMD" slot="start" aria-hidden="true" />
					<IonLabel>{{ $t("options:about.header") }}</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/testingGrounds" v-if="isDev">
					<IonIcon :ios="SparklesIOS" :md="SparklesMD" slot="start" aria-hidden="true" />
					{{ $t("testingGrounds:header") }}
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
