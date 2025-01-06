<script setup lang="ts">
	import { IonApp, IonRouterOutlet, useIonRouter, useBackButton } from "@ionic/vue";

	import { computed, provide } from "vue";
	import { isIOSIonicMode } from "./lib/mode";
	import { accessibilityConfig } from "./lib/config";

	provide("isIOS", computed(isIOSIonicMode));
	provide("reducedMotion", accessibilityConfig.reducedMotion);

	const router = useIonRouter();
	
	if ('isTauri' in window) {
		useBackButton(-1, () => {
			if (!router.canGoBack())
				window.AmpersandNative.exitApp();
		});
	}
</script>

<template>
	<IonApp>
		<IonRouterOutlet />
	</IonApp>
</template>
