<script setup lang="ts">
	import { IonApp, IonRouterOutlet, useIonRouter } from "@ionic/vue";
	import { useRouter } from "vue-router";

	import { computed, onMounted, provide } from "vue";
	import ModalContainer from "./components/ModalContainer.vue";
	import { setRouterCanGoBack } from "./lib/util/backbutton";
	import { dismissSplash } from "./lib/native/plugin";
	import { appConfig } from "./lib/config";
	import AssetFonts from "./components/AssetFonts.vue";
	import { sendFrontingChangedEvent } from "./lib/db/tables/frontingEntries";

	provide("isDevServer", computed(() => import.meta.env.MODE === "development"));
	provide("isDev", computed(() => import.meta.env.MODE === "development" || appConfig.isDeveloperMode));

	const ionRouter = useIonRouter();
	const vueRouter = useRouter();

	void setRouterCanGoBack(ionRouter.canGoBack());
	vueRouter.afterEach(() => {
		setRouterCanGoBack(ionRouter.canGoBack());
	});

	onMounted(async () => {
		await dismissSplash();
		await sendFrontingChangedEvent(true);
	});
</script>

<template>
	<IonApp>
		<IonRouterOutlet />
		<ModalContainer />
		<AssetFonts />
	</IonApp>
</template>
