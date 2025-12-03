<script setup lang="ts">
	import { IonContent, IonPage, IonButton, useIonRouter } from "@ionic/vue";
	import { ref } from "vue";
	import Spinner from "../../components/Spinner.vue";
	import { importDatabaseFromBinary } from "../../lib/db/ioutils";
	import { getFiles, slideAnimation, toast } from "../../lib/util/misc";
	import { useTranslation } from "i18next-vue";
	import { getTables } from "../../lib/db/tables";
	import { resetConfig } from "../../lib/config";

	const loading = ref(false);

	const i18next = useTranslation();
	const router = useIonRouter();

	async function importFromPreviousInstallation() {
		const files = await getFiles(undefined, false);
		try{
			if (!files.length) throw new Error("no files specified");
			loading.value = true;
			await importDatabaseFromBinary().dbPromise;
		}catch(_e){
			resetConfig();
			await Promise.all(Object.values(getTables()).map(x => x.clear()));
			await toast(i18next.t("onboarding:importScreen.error"));
			loading.value = false;
			return;
		}
		router.replace("/onboarding/end/", slideAnimation);
	}

	/*
	async function importFromSimplyPlural() {
		const files = await getFiles(undefined, false);
		try{
			if (!files.length) throw new Error("no files specified");
			loading.value = true;
			const spExport = JSON.parse(await files[0].text());
			const result = await importSimplyPlural(spExport);
			if (!result) throw new Error("errored out");
		}catch(_e){
			await Promise.all(Object.values(getTables()).map(x => x.clear()));
			await toast(i18next.t("onboarding:importScreen.errorSp"));
			loading.value = false;
			return;
		}
		router.replace("/onboarding/end/", slideAnimation);
	}

	async function importFromPluralKit() {
		const files = await getFiles(undefined, false);
		try{
			if (!files.length) throw new Error("no files specified");
			loading.value = true;
			const pkExport = JSON.parse(await files[0].text());
			const result = await importPluralKit(pkExport);
			if(!result) throw new Error("errored out");
		}catch(_e){
			await Promise.all(Object.values(getTables()).map(x => x.clear()));
			await toast(i18next.t("onboarding:importScreen.errorPk"));
			loading.value = false;
			return;
		}
		router.replace("/onboarding/end/", slideAnimation);
	}

	async function importFromTupperbox() {
		const files = await getFiles(undefined, false);
		try{
			if (!files.length) throw new Error("no files specified");
			loading.value = true;
			const tuExport = JSON.parse(await files[0].text());
			const result = await importTupperBox(tuExport);
			if(!result) throw new Error("errored out");
		}catch(_e){
			await Promise.all(Object.values(getTables()).map(x => x.clear()));
			await toast(i18next.t("onboarding:importScreen.errorTu"));
			loading.value = false;
			return;
		}
		router.replace("/onboarding/end/", slideAnimation);
	}
	*/
</script>

<template>
	<IonPage>
		<IonContent>
			<Transition name="slide">
				<div v-if="!loading" class="import-container">
					<h1>{{ $t("onboarding:importScreen.header") }}</h1>

					<IonButton @click="importFromPreviousInstallation">
						{{ $t("onboarding:importScreen.prevInstall") }}
					</IonButton>

					<!--
					<IonButton class="tonal" @click="importFromSimplyPlural">
						{{ $t("onboarding:importScreen.simplyPlural") }}
					</IonButton>

					<IonButton class="tonal" @click="importFromPluralKit">
						{{ $t("onboarding:importScreen.pluralKit") }}
					</IonButton>

					<IonButton class="tonal" @click="importFromTupperbox">
						{{ $t("onboarding:importScreen.tupperbox") }}
					</IonButton>
					-->
		
					<IonButton fill="clear" @click="router.replace('/onboarding/system/', slideAnimation)">
						{{ $t("onboarding:importScreen.startFromScratch") }}
					</IonButton>
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