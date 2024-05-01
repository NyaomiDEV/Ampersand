<script setup lang="ts">
	import { IonApp, IonRouterOutlet } from "@ionic/vue";

	// Branding theme
	import { defineMaterialTheme } from "./lib/theme";
	import "./lib/theme/style.css";

	defineMaterialTheme("#7E5700");
</script>

<template>
	<IonApp>
		<IonRouterOutlet />
	</IonApp>
</template>
