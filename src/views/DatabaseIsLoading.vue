<script setup lang="ts">
	import { watch } from "vue";
	import { IonContent, IonPage, IonProgressBar, useIonRouter } from "@ionic/vue";
	import { useRoute } from "vue-router";

	import { db, init, initMetrics } from "../lib/db";
	import Spinner from "../components/Spinner.vue";
	
	const router = useIonRouter();
	const route = useRoute();

	watch(init, () => {
		if(init.value)
			router.replace(route.query.wantedPath || "/");
	}, { immediate: true });
</script>

<template>
	<IonPage>
		<IonContent>
			<div class="flex">
				<div class="text">
					<h2>{{ $t("other:loading") }}</h2>
					<Spinner size="96px" />
				</div>
				<IonProgressBar :value="[...initMetrics.keys()].filter(x => x !== '_total').length / Object.keys(db).length" />
			</div>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	ion-content {
		--padding-bottom: var(--ion-safe-area-bottom, 0px);
	}

	div.flex, div.text {
		display: flex;
		text-align: center;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}

	div.text {
		gap: 16px;
		padding: 1em;
	}
</style>