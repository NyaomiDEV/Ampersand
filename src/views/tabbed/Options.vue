<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonItem, IonListHeader, IonLabel, IonPage, IonTitle, IonToolbar, IonIcon } from '@ionic/vue';
	import { computed } from 'vue';
	import { isIOSIonicMode } from '../../lib/mode';

	import {
		person as SystemIOS,
		analytics as FrontHistoryIOS,
		newspaper as MessageBoardIOS,
		pricetag as TagIOS,
		notifications as RemindersIOS,
		cog as SettingsIOS,
		lockClosed as SecurityIOS,
		accessibility as AccessibilityIOS,
		swapVertical as ImportExportIOS,
		informationCircle as AboutIOS,
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

	const isIOS = computed(isIOSIonicMode);
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
				
				<IonItem button routerLink="/options/system">
					<IonIcon :ios="SystemIOS" :md="SystemMD" slot="start" aria-hidden="true" />
					<IonLabel>System name and photo</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/front_history">
					<IonIcon :ios="FrontHistoryIOS" :md="FrontHistoryMD" slot="start" aria-hidden="true" />
					<IonLabel>Front history</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/message_board">
					<IonIcon :ios="MessageBoardIOS" :md="MessageBoardMD" slot="start" aria-hidden="true" />
					<IonLabel>Message board</IonLabel>
				</IonItem>

				<IonItem button routerLink="/options/tag_management">
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

				<IonItem button routerLink="/options/app_settings">
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

				<IonItem button routerLink="/options/import_export">
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
