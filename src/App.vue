<script setup lang="ts">
	import { IonApp, IonRouterOutlet, useIonRouter } from "@ionic/vue";
	import { useRouter } from "vue-router";

	import { computed, provide } from "vue";
	import { isIOSIonicMode } from "./lib/mode";
	import ModalContainer from "./components/ModalContainer.vue";
	import { setRouterCanGoBack } from "./lib/util/backbutton";

	provide("isIOS", computed(isIOSIonicMode));
	provide("isDev", computed(() => import.meta.env.MODE === 'development'));

	const ionRouter = useIonRouter();
	const vueRouter = useRouter();

	setRouterCanGoBack(ionRouter.canGoBack());
	vueRouter.afterEach(() => {
		setRouterCanGoBack(ionRouter.canGoBack());
	});

</script>

<template>
	<IonApp>
		<IonRouterOutlet />
		<ModalContainer />
	</IonApp>
</template>
