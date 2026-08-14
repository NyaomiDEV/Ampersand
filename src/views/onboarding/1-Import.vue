<script setup lang="ts">
	import { IonContent, IonPage, IonButton, useIonRouter, IonIcon } from "@ionic/vue";
	import { ref } from "vue";
	import Spinner from "../../components/Spinner.vue";
	import { importArchive } from "../../lib/db/ioutils/archive";
	import { slideAnimation, toast } from "../../lib/util/misc";
	import { useTranslation } from "i18next-vue";
	import { clearAllDatabase } from "../../lib/db";
	import { resetConfig } from "../../lib/config";

	import importMD from "@material-symbols/svg-600/rounded/download.svg";

	const loading = ref(false);

	const i18next = useTranslation();
	const router = useIonRouter();

	async function importFromPreviousInstallation() {
		try{
			loading.value = true;
			const result = await importArchive().status;
			if(!result) throw new Error("errored out");
		}catch(_e){
			console.error(_e);
			resetConfig();
			await clearAllDatabase();
			await toast(i18next.t("onboarding:importScreen.error"));
			loading.value = false;
			return;
		}
		router.replace("/onboarding/end/", slideAnimation);
	}
</script>

<template>
	<IonPage>
		<IonContent>
			<Transition name="slide">
				<div v-if="!loading" class="import-container">
					<h1>{{ $t("onboarding:importScreen.header") }}</h1>

					<IonButton @click="importFromPreviousInstallation">
						<IonIcon slot="start" :icon="importMD" />
						{{ $t("onboarding:importScreen.prevInstall") }}
					</IonButton>
		
					<IonButton fill="clear" @click="router.replace('/onboarding/system/', slideAnimation)">
						{{ $t("onboarding:importScreen.startFromScratch") }}
					</IonButton>

					<p>{{ $t("onboarding:importScreen.thirdPartyHint") }}</p>
				</div>
			</Transition>
			<Transition name="slide">
				<div v-if="loading" class="import-loading-container">
					<h1>{{ $t("onboarding:importScreen.pleaseWait") }}</h1>
					<Spinner />
				</div>
			</Transition>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	.import-container, .import-loading-container {
		position: absolute;
		display: flex;
		width: 100%;
		min-height: 100%;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		text-align: center;
		gap: 16px;
		padding: 1em;

		h1 {
			font-size: 2.25em;
			line-height: normal;
		}
	}

	.slide-enter-active,
	.slide-leave-active {
		transition-timing-function: cubic-bezier(0.47,0,0.745,0.715);
		transition-duration: 200ms;
		transition-property: all;
	}

	.slide-enter-from {
		transform: translateX(40px);
		opacity: 0;
	}

	.slide-enter-to {
		transform: translateX(0px);
		opacity: 1;
	}

	.slide-leave-from {
		transform: translateX(0px);
		opacity: 1;
	}

	.slide-leave-to {
		transform: translateX(-40px);
		opacity: 0;
	}
</style>