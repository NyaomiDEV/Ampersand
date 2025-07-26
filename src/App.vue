<script setup lang="ts">
	import { IonApp, IonRouterOutlet, useIonRouter } from "@ionic/vue";
	import { useRouter } from "vue-router";

	import { computed, provide } from "vue";
	import { isIOSIonicMode } from "./lib/mode";
	import { setCanGoBack } from "./lib/native/ampersand";
	import ModalContainer from "./components/ModalContainer.vue";

	provide("isIOS", computed(isIOSIonicMode));
	provide("isDev", computed(() => import.meta.env.MODE === 'development'));

	const ionRouter = useIonRouter();
	const vueRouter = useRouter();

	let canGoBack = ionRouter.canGoBack();

	vueRouter.afterEach(() => {
		const newCanGoBack = ionRouter.canGoBack();

		if(newCanGoBack !== canGoBack){
			canGoBack = newCanGoBack;
			setCanGoBack(newCanGoBack);
		}
	});

</script>

<template>
	<IonApp>
		<IonRouterOutlet />
		<ModalContainer />
	</IonApp>
</template>
