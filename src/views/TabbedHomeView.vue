<script setup lang="ts">
	import { IonPage, IonTabs, IonTabBar, IonRouterOutlet, IonTabButton, IonIcon } from "@ionic/vue";

	import {
		homeOutline as HomeIOS,
		sparklesOutline as SparklesIOS,
		peopleOutline as PeopleIOS,
		bookOutline as JournalIOS,
		chatboxEllipsesOutline as ChatIOS,
		menuOutline as OptionsIOS
	} 
	from "ionicons/icons";

	import SparklesMD from '@material-design-icons/svg/outlined/star.svg';
	import PeopleMD from '@material-design-icons/svg/outlined/group.svg';
	import JournalMD from '@material-design-icons/svg/outlined/book.svg';
	import HomeMD from '@material-design-icons/svg/outlined/home.svg';
	import ChatMD from '@material-design-icons/svg/outlined/chat.svg';
	import OptionsMD from '@material-design-icons/svg/outlined/menu.svg'
</script>

<template>
	<IonPage>
		<IonTabs>
			<IonRouterOutlet />

			<IonTabBar :translucent="true" slot="bottom">

				<IonTabButton tab="members" href="/members">
					<IonIcon :ios="PeopleIOS" :md="PeopleMD" />
					{{ $t("members:header") }}
				</IonTabButton>

				<IonTabButton tab="journal" href="/journal">
					<IonIcon :ios="JournalIOS" :md="JournalMD" />
					{{ $t("journal:header") }}
				</IonTabButton>

				<IonTabButton tab="dashboard" href="/dashboard">
					<IonIcon :ios="HomeIOS" :md="HomeMD" />
					{{ $t("dashboard:header") }}
				</IonTabButton>

				<IonTabButton tab="chats" href="/chats">
					<IonIcon :ios="ChatIOS" :md="ChatMD" />
					{{ $t("chats:header") }}
				</IonTabButton>

				<IonTabButton tab="options" href="/options">
					<IonIcon :ios="OptionsIOS" :md="OptionsMD" />
					{{ $t("options:options.header") }}
				</IonTabButton>
			
				<IonTabButton tab="testingGrounds" href="/testingGrounds">
					<IonIcon :ios="SparklesIOS" :md="SparklesMD" />
					{{ $t("testingGrounds:header") }}
				</IonTabButton>

			</IonTabBar>
		</IonTabs>
	</IonPage>
</template>
