<script setup lang="ts">
	import { IonPage, IonTabs, IonTabBar, IonRouterOutlet, IonTabButton, IonIcon } from "@ionic/vue";

	import {
		home as HomeIOS,
		sparkles as SparklesIOS
	} from "ionicons/icons";

	import HomeMD from '@material-design-icons/svg/filled/home.svg';
	import SparklesMD from '@material-design-icons/svg/filled/star.svg';
</script>

<template>
	<IonPage>
		<IonTabs>
			<IonRouterOutlet />

			<IonTabBar
				:translucent="true"
				slot="bottom"
			>

				<IonTabButton tab="dashboard" href="/dashboard">
					<IonIcon :ios="HomeIOS" :md="HomeMD" />
					Dashboard
				</IonTabButton>
			
				<IonTabButton tab="testingGrounds" href="/testingGrounds">
					<IonIcon :ios="SparklesIOS" :md="SparklesMD" />
					Testing grounds
				</IonTabButton>

			</IonTabBar>
		</IonTabs>
	</IonPage>
</template>
