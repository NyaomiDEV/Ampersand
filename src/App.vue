<script setup lang="ts">
	import { IonApp, IonRouterOutlet, useIonRouter } from "@ionic/vue";
	import { useRoute, useRouter } from "vue-router";

	import { computed, provide, watch } from "vue";
	import ModalContainer from "./components/ModalContainer.vue";
	import { setRouterCanGoBack } from "./lib/util/backbutton";
	import { dismissSplash } from "./lib/native/plugin";
	import { appConfig } from "./lib/config";
	import AssetFonts from "./components/AssetFonts.vue";
	import { sendFrontingChangedEvent } from "./lib/db/tables/frontingEntries";
	import { platform } from "@tauri-apps/plugin-os";

	// Notifications
	import { ensureNotifyPerms, registerChannels } from "./lib/notifications";
	import { init } from "./lib/db";

	provide("isDevServer", computed(() => import.meta.env.MODE === "development"));
	provide("isDev", computed(() => import.meta.env.MODE === "development" || appConfig.isDeveloperMode));

	const ionRouter = useIonRouter();
	const vueRouter = useRouter();
	const route = useRoute();

	void setRouterCanGoBack(ionRouter.canGoBack());
	vueRouter.afterEach(() => {
		setRouterCanGoBack(ionRouter.canGoBack());
	});

	let timeout: number | undefined = setTimeout(async () => await dismissSplash(), 3 * 1000);

	const watcher = watch([init, route], async () => {
		if(!init.value || route.name === "DatabaseIsLoading") return;

		clearTimeout(timeout);
		timeout = undefined;

		// dismiss splash
		await dismissSplash();

		// notifications
		if(await ensureNotifyPerms(true))
			await registerChannels();

		// defer fronting changed event to not conflict with other more important UI-level things
		void sendFrontingChangedEvent(true);

		// unregister watcher
		watcher();
	}, { immediate: true });
</script>

<template>
	<IonApp name="Ampersand">
		<IonRouterOutlet />
		<ModalContainer />
		<AssetFonts />
	</IonApp>
	<div v-if="platform() === 'macos'" data-tauri-drag-region class="window-overlay-drag" />
</template>

<style scoped>
	div.window-overlay-drag {
		display: block;
		position: absolute;
		top: 0;
		left: 0;
		height: var(--ion-safe-area-top, 0px);
		width: 100%;
		z-index: 9000;
	}
</style>