<script setup lang="ts">
	import { IonRange, IonItem } from "@ionic/vue";
	import { appConfig } from "../../../lib/config";
</script>

<template>
	<IonItem>
		<IonRange
			v-model="appConfig.dashboardSettings.frontingHistoryCarousel.settings.maxDays"
			:label="$t('appSettings:dashboard.frontingHistoryCarousel.maxDays')"
			label-placement="stacked"
			:min="1"
			:max="10"
			:ticks="false"
			:snaps="true"
			:pin="true"
		/>
	</IonItem>
</template>