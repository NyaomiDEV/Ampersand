<script setup lang="ts">
	import { IonApp, IonRouterOutlet } from "@ionic/vue";

	import { computed, provide } from "vue";
	import { isIOSIonicMode } from "./lib/mode";

	provide("isIOS", computed(isIOSIonicMode));
</script>

<template>
	<IonApp>
		<IonRouterOutlet />
	</IonApp>
</template>
