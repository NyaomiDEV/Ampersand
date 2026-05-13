<script setup lang="ts">
	import { watch } from "vue";
	import { IonPage, IonProgressBar, useIonRouter } from "@ionic/vue";
	import { useRoute } from "vue-router";

	import { init, initProgress } from "../lib/db";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	
	const router = useIonRouter();
	const route = useRoute();

	watch(init, () => {
		if(init.value === true)
			router.replace(route.query.wantedPath || "/");
	}, { immediate: true });
</script>

<template>
	<IonPage>
		<IonProgressBar :value="initProgress" />
		<SpinnerFullscreen />
	</IonPage>
</template>
