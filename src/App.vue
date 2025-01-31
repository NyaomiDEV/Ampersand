<script setup lang="ts">
	import { IonApp, IonRouterOutlet, useIonRouter, useBackButton } from "@ionic/vue";

	import { computed, provide } from "vue";
	import { isIOSIonicMode, isTauri } from "./lib/mode";
	import ModalContainer from "./components/ModalContainer.vue";

	provide("isIOS", computed(isIOSIonicMode));

	const router = useIonRouter();
	
	if (isTauri()) {
		useBackButton(-1, () => {
			if (!router.canGoBack())
				window.AmpersandNative.exitApp();
		});
	}
</script>

<template>
	<IonApp>
		<IonRouterOutlet />
		<ModalContainer />
	</IonApp>
</template>
