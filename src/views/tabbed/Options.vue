<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonItem, IonListHeader, IonLabel, IonPage, IonTitle, IonToolbar, IonIcon } from '@ionic/vue';
	import { inject } from 'vue';

	import {
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
	} from "ionicons/icons";

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

	const isIOS = inject<boolean>("isIOS");
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonTitle>
					Options
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>

			<IonListHeader>
				<IonLabel>Management</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS">
				
				<IonItem button routerLink="/options/systemSettings">
					<IonIcon :ios="SystemIOS" :md="SystemMD" slot="start" aria-hidden="true" />
					<IonLabel>System name and photo</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/frontHistory">
					<IonIcon :ios="FrontHistoryIOS" :md="FrontHistoryMD" slot="start" aria-hidden="true" />
					<IonLabel>Front history</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/messageBoard">
					<IonIcon :ios="MessageBoardIOS" :md="MessageBoardMD" slot="start" aria-hidden="true" />
					<IonLabel>Message board</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/tagManagement">
					<IonIcon :ios="TagIOS" :md="TagMD" slot="start" aria-hidden="true" />
					<IonLabel>Tag management</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/reminders">
					<IonIcon :ios="RemindersIOS" :md="RemindersMD" slot="start" aria-hidden="true" />
					<IonLabel>Reminders</IonLabel>
				</IonItem>

			</IonList>

			<IonListHeader>
				<IonLabel>Settings</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS">

				<IonItem button routerLink="/options/appSettings">
					<IonIcon :ios="SettingsIOS" :md="SettingsMD" slot="start" aria-hidden="true" />
					<IonLabel>App settings</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/security">
					<IonIcon :ios="SecurityIOS" :md="SecurityMD" slot="start" aria-hidden="true" />
					<IonLabel>Security</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/accessibility">
					<IonIcon :ios="AccessibilityIOS" :md="AccessibilityMD" slot="start" aria-hidden="true" />
					<IonLabel>Accessibility</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/importExport">
					<IonIcon :ios="ImportExportIOS" :md="ImportExportMD" slot="start" aria-hidden="true" />
					<IonLabel>Import / Export</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/about">
					<IonIcon :ios="AboutIOS" :md="AboutMD" slot="start" aria-hidden="true" />
					<IonLabel>About</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
