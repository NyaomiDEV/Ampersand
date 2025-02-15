<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonItem, IonLabel, IonPage, IonTitle, IonToolbar, IonBackButton, IonProgressBar, toastController } from '@ionic/vue';
	import { inject, ref } from 'vue';
	import { importDatabaseFromBinary, exportDatabaseToBinary } from '../../lib/db/ioutils';
	import { downloadBlob, getFiles } from '../../lib/util/misc';
	import dayjs from 'dayjs';
	import { save } from '@tauri-apps/plugin-dialog';
	import { writeFile } from '@tauri-apps/plugin-fs';
	import { useTranslation } from 'i18next-vue';
	import { importPluralKit } from '../../lib/db/external/pluralkit';
	import { importTupperBox } from '../../lib/db/external/tupperbox';
	import { importSimplyPlural } from '../../lib/db/external/simplyplural';

	const isIOS = inject<boolean>("isIOS");
	const loading = ref(false);

	const i18next = useTranslation();

	async function importDb(){
		loading.value = true;

		const files = await getFiles(undefined, false);
		if(files.length){
			const file = files[0];
			try{
				const result = await importDatabaseFromBinary(new Uint8Array(await file.arrayBuffer()));

				if(!result) throw new Error("errored out");

				const statusMessage = await toastController.create({
					message: i18next.t("importExport:status.imported"),
					duration: 1500
				});

				await statusMessage.present();
			}catch(e){
				const statusMessage = await toastController.create({
					message: i18next.t("importExport:status.error"),
					duration: 1500
				});

				await statusMessage.present();
			}
		}

		loading.value = false;
	}

	async function importSp() {
		loading.value = true;

		const files = await getFiles(undefined, false);
		if(files.length){
			const file = files[0];

			try {
				const spExport = JSON.parse(await file.text());
				const result = await importSimplyPlural(spExport);

				if(!result) throw new Error("errored out");

				const statusMessage = await toastController.create({
					message: i18next.t("importExport:status.importedSp"),
					duration: 1500
				});

				await statusMessage.present();
			}catch(e){
				console.error(e);
				const statusMessage = await toastController.create({
					message: i18next.t("importExport:status.errorSp"),
					duration: 1500
				});

				await statusMessage.present();
			}
		}

		loading.value = false;
	}

	async function importPk() {
		loading.value = true;

		const files = await getFiles(undefined, false);
		if(files.length){
			const file = files[0];

			try{
				const pkExport = JSON.parse(await file.text());
				const result = await importPluralKit(pkExport);

				if(!result) throw new Error("errored out");

				const statusMessage = await toastController.create({
					message: i18next.t("importExport:status.importedPk"),
					duration: 1500
				});

				await statusMessage.present();
			}catch(e){
				const statusMessage = await toastController.create({
					message: i18next.t("importExport:status.errorPk"),
					duration: 1500
				});

				await statusMessage.present();
			}
		}

		loading.value = false;
	}

	async function importTu() {
		loading.value = true;

		const files = await getFiles(undefined, false);
		if (files.length) {
			const file = files[0];

			try{
				const tuExport = JSON.parse(await file.text());
				const result = await importTupperBox(tuExport);

				if(!result) throw new Error("errored out");

				const statusMessage = await toastController.create({
					message: i18next.t("importExport:status.importedTu"),
					duration: 1500
				});

				await statusMessage.present();
			}catch(e) {
				const statusMessage = await toastController.create({
					message: i18next.t("importExport:status.errorTu"),
					duration: 1500
				});

				await statusMessage.present();
			}
		}

		loading.value = false;
	}

	async function exportDb(){
		loading.value = true;

		const data = await exportDatabaseToBinary();
		const date = dayjs().format("YYYY-MM-DD");

		if('isTauri' in window){
			const path = await save({
				filters: [{
					name: `ampersand-backup-${date}`,
					extensions: ["ampdb"]
				}]
			});

			if(path){
				await writeFile(path, data);
				const statusMessage = await toastController.create({
					message: i18next.t("importExport:status.exportedApp"),
					duration: 1500
				});

				await statusMessage.present();
			} else {
				const statusMessage = await toastController.create({
					message: i18next.t("importExport:status.errorExport"),
					duration: 1500
				});

				await statusMessage.present();
			}
		} else {
			downloadBlob(data,`ampersand-backup-${date}.ampdb`);

			const statusMessage = await toastController.create({
				message: i18next.t("importExport:status.exportedPwa"),
				duration: 1500
			});

			await statusMessage.present();
		}

		loading.value = false;
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>{{ $t("importExport:header") }}</IonTitle>
				<IonProgressBar v-if="loading" type="indeterminate" />
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList :inset="isIOS">

				<IonItem button @click="exportDb" :detail="true">
					<IonLabel>
						<h3>{{ $t("importExport:dbExport.title") }}</h3>
						<p>{{ $t("importExport:dbExport.desc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button @click="importDb" :detail="true">
					<IonLabel>
						<h3>{{ $t("importExport:dbImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button @click="importSp" :detail="true">
					<IonLabel>
						<h3>{{ $t("importExport:spImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button @click="importPk" :detail="true">
					<IonLabel>
						<h3>{{ $t("importExport:pkImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button @click="importTu" :detail="true">
					<IonLabel>
						<h3>{{ $t("importExport:tuImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
					</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
