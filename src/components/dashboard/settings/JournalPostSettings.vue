<script setup lang="ts">
	import { IonRange, IonItem } from "@ionic/vue";
	import { appConfig } from "../../../lib/config";
</script>

<template>
	<IonItem>
		<IonRange
			v-model="appConfig.dashboardSettings.journalPostCarousel.settings.maxDays"
			:label="$t('appSettings:dashboard.journalPostCarousel.maxDays')"
			label-placement="stacked"
			:min="1"
			:max="10"
			:ticks="true"
			:snaps="true"
			:pin="true"
		/>
	</IonItem>
</template>