<script setup lang="ts">
	import { IonApp, IonRouterOutlet } from "@ionic/vue";

	// Branding theme
	import { defineMaterialTheme } from "./lib/theme";
	import "./lib/theme/style.css";
	import { computed, provide } from "vue";
	import { isIOSIonicMode } from "./lib/mode";

	defineMaterialTheme("#7E5700");

	provide("isIOS", computed(isIOSIonicMode));
</script>

<template>
	<IonApp>
		<IonRouterOutlet />
	</IonApp>
</template>
