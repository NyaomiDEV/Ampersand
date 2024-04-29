<script setup lang="ts">
	import { IonPage, IonTabs, IonTabBar, IonRouterOutlet, IonTabButton } from "@ionic/vue";
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
					Dashboard
				</IonTabButton>
			
				<IonTabButton tab="testingGrounds" href="/testingGrounds">
					Testing grounds
				</IonTabButton>

			</IonTabBar>
		</IonTabs>
	</IonPage>
</template>