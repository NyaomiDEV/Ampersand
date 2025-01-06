<script setup lang="ts">
	import { IonPage, IonTabs, IonTabBar, IonRouterOutlet, IonTabButton, IonIcon, useIonRouter } from "@ionic/vue";

	import {
		homeOutline as HomeIOS,
		peopleOutline as PeopleIOS,
		bookOutline as JournalIOS,
		chatboxEllipsesOutline as ChatIOS,
		menuOutline as OptionsIOS
	} 
	from "ionicons/icons";

	import PeopleMD from '@material-design-icons/svg/outlined/group.svg';
	import JournalMD from '@material-design-icons/svg/outlined/book.svg';
	import HomeMD from '@material-design-icons/svg/outlined/home.svg';
	import ChatMD from '@material-design-icons/svg/outlined/chat.svg';
	import OptionsMD from '@material-design-icons/svg/outlined/menu.svg';

	const router = useIonRouter();
</script>

<template>
	<IonPage>
		<IonTabs>
			<IonRouterOutlet />

			<IonTabBar :translucent="true" slot="bottom">

				<IonTabButton tab="members" href="/members" @click="router.replace('/members')">
					<IonIcon :ios="PeopleIOS" :md="PeopleMD" />
					{{ $t("members:header") }}
				</IonTabButton>

				<IonTabButton tab="journal" href="/journal" @click="router.replace('/journal')" v-if="false">
					<IonIcon :ios="JournalIOS" :md="JournalMD" />
					{{ $t("journal:header") }}
				</IonTabButton>

				<IonTabButton tab="dashboard" href="/dashboard" @click="router.replace('/dashboard')">
					<IonIcon :ios="HomeIOS" :md="HomeMD" />
					{{ $t("dashboard:header") }}
				</IonTabButton>

				<IonTabButton tab="chats" href="/chats" @click="router.replace('/chats')" v-if="false">
					<IonIcon :ios="ChatIOS" :md="ChatMD" />
					{{ $t("chats:header") }}
				</IonTabButton>

				<IonTabButton tab="options" href="/options" @click="router.replace('/options')">
					<IonIcon :ios="OptionsIOS" :md="OptionsMD" />
					{{ $t("options:options.header") }}
				</IonTabButton>
			</IonTabBar>
		</IonTabs>
	</IonPage>
</template>
