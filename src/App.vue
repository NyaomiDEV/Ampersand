<script setup lang="ts">
	import { IonApp, IonRouterOutlet } from "@ionic/vue";

	import { computed, provide } from "vue";
	import { isIOSIonicMode } from "./lib/mode";
	import { getConfigEntry } from "./lib/config";
	import { AccessibilityConfig } from "./lib/config/types";

	provide("isIOS", computed(isIOSIonicMode));
	provide("reducedMotion", (getConfigEntry("accessibility") as AccessibilityConfig).reducedMotion)
</script>

<template>
	<IonApp>
		<IonRouterOutlet />
	</IonApp>
</template>
