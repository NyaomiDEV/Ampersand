<script setup lang="ts">
	console.log("vue hello");
	import { IonApp, IonRouterOutlet } from "@ionic/vue";

	import { computed, provide } from "vue";
	import { isIOSIonicMode } from "./lib/mode";
	import { accessibilityConfig } from "./lib/config";

	provide("isIOS", computed(isIOSIonicMode));
	provide("reducedMotion", accessibilityConfig.reducedMotion)
</script>

<template>
	<IonApp>
		<IonRouterOutlet />
	</IonApp>
</template>
