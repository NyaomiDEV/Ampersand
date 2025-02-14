<script setup lang="ts">
	import { IonContent, IonPage, IonButton, useIonRouter, toastController } from '@ionic/vue';
	import { ref } from 'vue';
	import Spinner from '../../components/Spinner.vue';
	import { importDatabaseFromBinary } from '../../lib/db/ioutils';
	import { getFiles, slideAnimation } from '../../lib/util/misc';
	import { importPluralKit } from '../../lib/db/external/pluralkit';
	import { importTupperBox } from '../../lib/db/external/tupperbox';
	import { importSimplyPlural } from '../../lib/db/external/simplyplural';
	import { useTranslation } from 'i18next-vue';
	import { getTables } from '../../lib/db';
	import { resetConfig } from '../../lib/config';

	const loading = ref(false);

	const i18next = useTranslation();
	const router = useIonRouter();

	async function importFromPreviousInstallation() {
		const files = await getFiles(undefined, false);
		if (files.length) {
			loading.value = true;
			const file = files[0];

			try{
				const result = await importDatabaseFromBinary(new Uint8Array(await file.arrayBuffer()));

				if(!result) throw new Error("errored out");
			}catch(e){
				resetConfig();
				await Promise.all(getTables().map(x => x.clear()));

				const statusMessage = await toastController.create({
					message: i18next.t("onboarding:importScreen.error"),
					duration: 1500
				});
				await statusMessage.present();

				loading.value = false;

				return;
			}
		}

		router.replace("/onboarding/end/", slideAnimation);
	}

	async function importFromSimplyPlural() {
		const files = await getFiles(undefined, false);
		if (files.length) {
			loading.value = true;
			const file = files[0];

			try{
				const spExport = JSON.parse(await file.text());
				const result = await importSimplyPlural(spExport);

				if (!result) throw new Error("errored out");
			}catch(e){
				await Promise.all(getTables().map(x => x.clear()));

				const statusMessage = await toastController.create({
					message: i18next.t("onboarding:importScreen.errorSp"),
					duration: 1500
				});
				await statusMessage.present();

				loading.value = false;

				return;
			}
		}

		router.replace("/onboarding/end/", slideAnimation);
	}

	async function importFromPluralKit() {
		const files = await getFiles(undefined, false);
		if (files.length) {
			loading.value = true;
			const file = files[0];

			try{
				const pkExport = JSON.parse(await file.text());
				const result = await importPluralKit(pkExport);

				if(!result) throw new Error("errored out");
			}catch(e){
				await Promise.all(getTables().map(x => x.clear()));

				const statusMessage = await toastController.create({
					message: i18next.t("onboarding:importScreen.errorPk"),
					duration: 1500
				});
				await statusMessage.present();

				loading.value = false;

				return;
			}
		}

		router.replace("/onboarding/end/", slideAnimation);
	}

	async function importFromTupperbox() {
		const files = await getFiles(undefined, false);
		if (files.length) {
			loading.value = true;
			const file = files[0];

			try{
				const tuExport = JSON.parse(await file.text());
				const result = await importTupperBox(tuExport);
				
				if(!result) throw new Error("errored out");
			}catch(e){
				await Promise.all(getTables().map(x => x.clear()));

				const statusMessage = await toastController.create({
					message: i18next.t("onboarding:importScreen.errorTu"),
					duration: 1500
				});
				await statusMessage.present();

				loading.value = false;

				return;
			}
		}

		router.replace("/onboarding/end/", slideAnimation);
	}
</script>

<template>
	<IonPage>
		<IonContent>
			<Transition name="slide">
			<div class="import-container" v-if="!loading">
				<h1>{{ $t("onboarding:importScreen.header") }}</h1>

				<IonButton @click="importFromPreviousInstallation">
					{{ $t("onboarding:importScreen.prevInstall") }}
				</IonButton>

				<IonButton class="tonal" @click="importFromSimplyPlural">
					{{ $t("onboarding:importScreen.simplyPlural") }}
				</IonButton>

				<IonButton class="tonal" @click="importFromPluralKit">
					{{ $t("onboarding:importScreen.pluralKit") }}
				</IonButton>

				<IonButton class="tonal" @click="importFromTupperbox">
					{{ $t("onboarding:importScreen.tupperbox") }}
				</IonButton>
		
				<IonButton fill="clear" @click="router.replace('/onboarding/system/', slideAnimation)">
					{{ $t("onboarding:importScreen.startFromScratch") }}
				</IonButton>
			</div>
			</Transition>
			<Transition name="slide">
				<div class="import-loading-container" v-if="loading">
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