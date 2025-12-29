<script setup lang="ts">
	import { IonApp, IonRouterOutlet, useIonRouter } from "@ionic/vue";
	import { useRouter } from "vue-router";

	import { computed, onMounted, provide } from "vue";
	import ModalContainer from "./components/ModalContainer.vue";
	import { setRouterCanGoBack } from "./lib/util/backbutton";
	import { dismissSplash } from "./lib/native/plugin";

	provide("isDev", computed(() => import.meta.env.MODE === "development"));

	const ionRouter = useIonRouter();
	const vueRouter = useRouter();

	void setRouterCanGoBack(ionRouter.canGoBack());
	vueRouter.afterEach(() => {
		setRouterCanGoBack(ionRouter.canGoBack());
	});

	onMounted(async () => {
		await dismissSplash();
	});
</script>

<template>
	<IonApp>
		<IonRouterOutlet />
		<ModalContainer />
	</IonApp>
</template>
