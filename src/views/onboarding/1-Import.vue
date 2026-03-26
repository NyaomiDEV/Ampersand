<script setup lang="ts">
	import { IonContent, IonPage, IonButton, useIonRouter, IonIcon } from "@ionic/vue";
	import { ref } from "vue";
	import Spinner from "../../components/Spinner.vue";
	import { importDatabaseFromBinary } from "../../lib/db/ioutils/old";
	import { getDocumentFile, promptYesNo, slideAnimation, toast } from "../../lib/util/misc";
	import { importPluralKit } from "../../lib/db/external/pluralkit";
	import { importTupperBox } from "../../lib/db/external/tupperbox";
	import { importSimplyPlural } from "../../lib/db/external/simplyplural";
	import { importOctocon } from "../../lib/db/external/octocon";
	import { useTranslation } from "i18next-vue";
	import { getTables } from "../../lib/db/tables";
	import { resetConfig, securityConfig } from "../../lib/config";

	import importMD from "@material-symbols/svg-600/outlined/download.svg";
	import octoMD from "@material-symbols/svg-600/outlined/neurology.svg";
	import spMD from "@material-symbols/svg-600/outlined/spa.svg";
	import tupMD from "@material-symbols/svg-600/outlined/package_2.svg";
	import pkMD from "@material-symbols/svg-600/outlined/pet_supplies.svg";

	const loading = ref(false);

	const i18next = useTranslation();
	const router = useIonRouter();

	async function promptRemoteConnection(){
		if(await promptYesNo(
			i18next.t("onboarding:importScreen.allowRemoteContent.header"),
			undefined,
			i18next.t("onboarding:importScreen.allowRemoteContent.desc"),
		))
			securityConfig.allowRemoteContent = true;
		else
			securityConfig.allowRemoteContent = false;
	}

	async function importFromPreviousInstallation() {
		try{
			loading.value = true;
			const result = await importDatabaseFromBinary().status;
			if(!result) throw new Error("errored out");
		}catch(_e){
			resetConfig();
			await Promise.all(Object.values(getTables()).map(x => x.clear()));
			await toast(i18next.t("onboarding:importScreen.error"));
			loading.value = false;
			return;
		}
		router.replace("/onboarding/end/", slideAnimation);
	}

	async function importFromSimplyPlural() {
		await promptRemoteConnection();
		try{
			const file = await getDocumentFile(["json"], false);
			if (!file) throw new Error("no files specified");
			loading.value = true;
			const spExport = JSON.parse(new TextDecoder("utf-8").decode(file));
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

	async function importFromOctocon() {
		await promptRemoteConnection();
		try{
			const file = await getDocumentFile(["json"], false);
			if (!file) throw new Error("no files specified");
			loading.value = true;
			const ocExport = JSON.parse(new TextDecoder("utf-8").decode(file));
			const result = await importOctocon(ocExport);
			if(!result) throw new Error("errored out");
		}catch(_e){
			await Promise.all(Object.values(getTables()).map(x => x.clear()));
			await toast(i18next.t("onboarding:importScreen.errorOc"));
			loading.value = false;
			return;
		}
		router.replace("/onboarding/end/", slideAnimation);
	}

	async function importFromPluralKit() {
		await promptRemoteConnection();
		try{
			const file = await getDocumentFile(["json"], false);
			if (!file) throw new Error("no files specified");
			loading.value = true;
			const pkExport = JSON.parse(new TextDecoder("utf-8").decode(file));
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
		await promptRemoteConnection();
		try{
			const file = await getDocumentFile(["json"], false);
			if (!file) throw new Error("no files specified");
			loading.value = true;
			const tuExport = JSON.parse(new TextDecoder("utf-8").decode(file));
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

					<IonButton class="tonal" @click="importFromSimplyPlural">
						<IonIcon slot="start" :icon="spMD" />
						{{ $t("onboarding:importScreen.simplyPlural") }}
					</IonButton>

					<IonButton class="tonal" @click="importFromOctocon">
						<IonIcon slot="start" :icon="octoMD" />
						{{ $t("onboarding:importScreen.octocon") }}
					</IonButton>

					<IonButton class="tonal" @click="importFromPluralKit">
						<IonIcon slot="start" :icon="pkMD" />
						{{ $t("onboarding:importScreen.pluralKit") }}
					</IonButton>

					<IonButton class="tonal" @click="importFromTupperbox">
						<IonIcon slot="start" :icon="tupMD" />
						{{ $t("onboarding:importScreen.tupperbox") }}
					</IonButton>
		
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