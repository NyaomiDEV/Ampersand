<script setup lang="ts">
	import { IonRadioGroup, IonRadio, IonItem, IonLabel, IonItemDivider } from "@ionic/vue";
	import { appConfig } from "../../../lib/config";
</script>

<template>
	<IonRadioGroup v-model="appConfig.dashboardSettings.currentFrontersCarousel.settings.type">
		<IonItemDivider>
			<IonLabel>{{ $t("appSettings:dashboard.currentFrontersCarousel.type") }}</IonLabel>
		</IonItemDivider>
		<IonItem>
			<IonRadio value="cards" justify="space-between">
				{{ $t("appSettings:dashboard.currentFrontersCarousel.cards") }}
			</IonRadio>
		</IonItem>
		<IonItem>
			<IonRadio value="list" justify="space-between">
				{{ $t("appSettings:dashboard.currentFrontersCarousel.list") }}
			</IonRadio>
		</IonItem>
	</IonRadioGroup>
</template>