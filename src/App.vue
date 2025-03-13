<script setup lang="ts">
	import { IonApp, IonRouterOutlet, useIonRouter, useBackButton } from "@ionic/vue";

	import { computed, provide } from "vue";
	import { isIOSIonicMode, isTauri } from "./lib/mode";
	import { exitApp } from "./lib/native/ampersand";
	import ModalContainer from "./components/ModalContainer.vue";

	provide("isIOS", computed(isIOSIonicMode));
	provide("isDev", computed(() => import.meta.env.MODE === 'development'));

	const router = useIonRouter();
	
	if (isTauri()) {
		useBackButton(-1, () => {
			if (!router.canGoBack())
				exitApp();
		});
	}
</script>

<template>
	<IonApp>
		<IonRouterOutlet />
		<ModalContainer />
	</IonApp>
</template>
