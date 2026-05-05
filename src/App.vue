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

	// Notifications
	import { ensureNotifyPerms, registerChannels } from "./lib/notifications";

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

		// notifications
		if(await ensureNotifyPerms(true))
			await registerChannels();

		// defer fronting changed event to not conflict with other more important UI-level things
		setTimeout(() => void sendFrontingChangedEvent(true), 250);
	});
</script>

<template>
	<IonApp>
		<IonRouterOutlet />
		<ModalContainer />
		<AssetFonts />
	</IonApp>
</template>
