<script setup lang="ts">
	import { IonPage, IonTabs, IonTabBar, IonRouterOutlet, IonTabButton, IonIcon } from "@ionic/vue";

	import { home, sparkles } from "ionicons/icons";
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
					<IonIcon :icon="home" />
					Dashboard
				</IonTabButton>
			
				<IonTabButton tab="testingGrounds" href="/testingGrounds">
					<IonIcon :icon="sparkles" />
					Testing grounds
				</IonTabButton>

			</IonTabBar>
		</IonTabs>
	</IonPage>
</template>