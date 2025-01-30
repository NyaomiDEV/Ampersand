<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonItem, IonLabel, IonPage, IonTitle, IonToolbar, IonBackButton, IonProgressBar, toastController} from '@ionic/vue';
	import { inject, ref } from 'vue';
	import { importDatabaseFromBinary, exportDatabaseToBinary, importAppConfigFromBinary, exportAppConfigToBinary } from '../../lib/db/ioutils';
	import { downloadBlob, getFiles } from '../../lib/util/misc';
	import dayjs from 'dayjs';
	import { save } from '@tauri-apps/plugin-dialog';
	import { writeFile } from '@tauri-apps/plugin-fs';
	import { useTranslation } from 'i18next-vue';

	const isIOS = inject<boolean>("isIOS");
	const loading = ref(false);

	const i18next = useTranslation();

	async function importDb(){
		loading.value = true;

		const files = await getFiles(undefined, false);
		if(files.length){
			const file = files[0];
			await importDatabaseFromBinary(new Uint8Array(await file.arrayBuffer()));

			const statusMessage = await toastController.create({
				message: i18next.t("options:importExport.status.database.imported"),
				duration: 1500
			});

			await statusMessage.present();
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
					message: i18next.t("options:importExport.status.database.exportedApp"),
					duration: 1500
				});

				await statusMessage.present();
			} else {
				const statusMessage = await toastController.create({
					message: i18next.t("options:importExport.status.database.error"),
					duration: 1500
				});

				await statusMessage.present();
			}
		} else {
			downloadBlob(data,`ampersand-backup-${date}.ampdb`);

			const statusMessage = await toastController.create({
				message: i18next.t("options:importExport.status.database.exportedPwa"),
				duration: 1500
			});

			await statusMessage.present();
		}

		loading.value = false;
	}

	async function importSettings(){
		loading.value = true;

		const files = await getFiles(undefined, false);
		if (files.length) {
			const file = files[0];
			await importAppConfigFromBinary(new Uint8Array(await file.arrayBuffer()));

			const statusMessage = await toastController.create({
				message: i18next.t("options:importExport.status.settings.imported"),
				duration: 1500
			});

			await statusMessage.present();
		}

		loading.value = false;
	}
	async function exportSettings(){
		loading.value = true;

		const data = await exportAppConfigToBinary();
		const date = dayjs().format("YYYY-MM-DD");
		if('isTauri' in window){
			const path = await save({
				filters: [{
					name: `ampersand-config-${date}`,
					extensions: ["ampcfg"]
				}]
			});

			if(path) {
				await writeFile(path, data);

				const statusMessage = await toastController.create({
					message: i18next.t("options:importExport.status.settings.exportedApp"),
					duration: 1500
				});

				await statusMessage.present();
			} else {
				const statusMessage = await toastController.create({
					message: i18next.t("options:importExport.status.settings.error"),
					duration: 1500
				});

				await statusMessage.present();				
			}
		} else {
			downloadBlob(data, `ampersand-config-${date}.ampcfg`);

			const statusMessage = await toastController.create({
				message: i18next.t("options:importExport.status.settings.exportedPwa"),
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
				<IonTitle>{{ $t("options:importExport.header") }}</IonTitle>
				<IonProgressBar v-if="loading" type="indeterminate" />
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">

				<IonItem button @click="exportDb" :detail="true">
					<IonLabel>
						<h3>{{ $t("options:importExport.dbExport.title") }}</h3>
						<p>{{ $t("options:importExport.dbExport.desc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button @click="importDb" :detail="true">
					<IonLabel>
						<h3>{{ $t("options:importExport.dbImport.title") }}</h3>
						<p>{{ $t("options:importExport.dbImport.desc") }}</p>
					</IonLabel>
				</IonItem>
					
				<IonItem button @click="exportSettings" :detail="true">
					<IonLabel>
						<h3>{{ $t("options:importExport.settingsExport.title") }}</h3>
						<p>{{ $t("options:importExport.settingsExport.desc") }}</p>
					</IonLabel>	
				</IonItem>

									
				<IonItem button @click="importSettings" :detail="true">
					<IonLabel>
						<h3>{{ $t("options:importExport.settingsImport.title") }}</h3>
						<p>{{ $t("options:importExport.settingsImport.desc") }}</p>
					</IonLabel>	
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
