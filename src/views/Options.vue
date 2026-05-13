<script setup lang="ts">
	import { IonContent, IonFab, IonFabButton, IonList, IonItem, IonListHeader, IonLabel, IonPage, IonTitle, IonToolbar, IonIcon, useIonRouter } from "@ionic/vue";
	import { inject } from "vue";
	import CollapsibleHeaderbar from "../components/CollapsibleHeaderbar.vue";

	import PeopleMD from "@material-symbols/svg-600/rounded/group.svg";
	import JournalMD from "@material-symbols/svg-600/rounded/book.svg";
	import LockMD from "@material-symbols/svg-600/rounded/lock.svg";
	import TestingMD from "@material-symbols/svg-600/rounded/taunt.svg";
	import SystemMD from "@material-symbols/svg-600/rounded/groups.svg";
	import FrontHistoryMD from "@material-symbols/svg-600/rounded/show_chart.svg";
	import MessageBoardMD from "@material-symbols/svg-600/rounded/newsmode.svg";
	import TagMD from "@material-symbols/svg-600/rounded/sell.svg";
	import RemindersMD from "@material-symbols/svg-600/rounded/notification_add.svg";
	import AnalyticsMD from "@material-symbols/svg-600/rounded/bar_chart.svg";
	import SettingsMD from "@material-symbols/svg-600/rounded/settings.svg";
	import AccessibilityMD from "@material-symbols/svg-600/rounded/accessibility_new.svg";
	import ImportExportMD from "@material-symbols/svg-600/rounded/swap_vert.svg";
	import AboutMD from "@material-symbols/svg-600/rounded/info.svg";
	import FolderMD from "@material-symbols/svg-600/rounded/folder_open.svg";
	import CustomFieldsMD from "@material-symbols/svg-600/rounded/format_list_bulleted_add.svg";
	import ResourcesMD from "@material-symbols/svg-600/rounded/menu_book.svg";
	import NotesMD from "@material-symbols/svg-600/rounded/note_stack.svg";

	import { appConfig, securityConfig } from "../lib/config";
	import { lock } from "../lib/applock";

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

				<IonItem v-if="notInTab('members')" button router-link="/lists/members">
					<IonIcon slot="start" :icon="PeopleMD" aria-hidden="true" />
					<IonLabel>{{ $t("members:header") }}</IonLabel>
				</IonItem>

				<IonItem v-if="notInTab('journal')" button router-link="/lists/journal">
					<IonIcon slot="start" :icon="JournalMD" aria-hidden="true" />
					<IonLabel>{{ $t("journal:header") }}</IonLabel>
				</IonItem>

				<IonItem v-if="notInTab('frontHistory')" button router-link="/lists/frontHistory">
					<IonIcon slot="start" :icon="FrontHistoryMD" aria-hidden="true" />
					<IonLabel>{{ $t("frontHistory:header") }}</IonLabel>
				</IonItem>

				<IonItem v-if="notInTab('analytics')" button router-link="/lists/analytics">
					<IonIcon slot="start" :icon="AnalyticsMD" aria-hidden="true" />
					<IonLabel>{{ $t("analytics:header") }}</IonLabel>
				</IonItem>

				<IonItem v-if="notInTab('messageBoard')" button router-link="/lists/messageBoard">
					<IonIcon slot="start" :icon="MessageBoardMD" aria-hidden="true" />
					<IonLabel>{{ $t("messageBoard:header") }}</IonLabel>
				</IonItem>

				<IonItem v-if="notInTab('systems')" button router-link="/lists/systems">
					<IonIcon slot="start" :icon="SystemMD" aria-hidden="true" />
					<IonLabel>{{ $t("systems:header") }}</IonLabel>
				</IonItem>

				<IonItem v-if="notInTab('tagManagement')" button router-link="/lists/tagManagement">
					<IonIcon slot="start" :icon="TagMD" aria-hidden="true" />
					<IonLabel>{{ $t("tagManagement:header") }}</IonLabel>
				</IonItem>

				<IonItem v-if="notInTab('assetManager')" button router-link="/lists/assetManager">
					<IonIcon slot="start" :icon="FolderMD" aria-hidden="true" />
					<IonLabel>{{ $t("assetManager:header") }}</IonLabel>
				</IonItem>

				<IonItem v-if="notInTab('notes')" button router-link="/lists/notes">
					<IonIcon slot="start" :icon="NotesMD" aria-hidden="true" />
					<IonLabel>{{ $t("notes:header") }}</IonLabel>
				</IonItem>

				<IonItem v-if="notInTab('customFields')" button router-link="/lists/customFields">
					<IonIcon slot="start" :icon="CustomFieldsMD" aria-hidden="true" />
					<IonLabel>{{ $t("customFields:header") }}</IonLabel>
				</IonItem>

				<IonItem v-if="notInTab('reminders')" button router-link="/lists/reminders">
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
				<IonFabButton v-if="securityConfig.password" @click="lockImmediately">
					<IonIcon :icon="LockMD" />
				</IonFabButton>

			</IonFab>
		</IonContent>
	</IonPage>
</template>
