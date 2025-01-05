<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonItem, IonLabel, IonPage, IonTitle, IonToolbar, IonBackButton} from '@ionic/vue';
	import { inject } from 'vue';
	import { importDatabaseFromBinary, exportDatabaseToBinary, importAppConfigFromBinary, exportAppConfigToBinary } from '../../lib/db/ioutils';
	import { downloadBlob, getFiles } from '../../lib/util/misc';
	import dayjs from 'dayjs';
	import { save } from '@tauri-apps/plugin-dialog';
	import { writeFile } from '@tauri-apps/plugin-fs';

	const isIOS = inject<boolean>("isIOS");

	async function importDb(){
		const files = await getFiles(undefined, false);
		if(files.length){
			const file = files[0];
			await importDatabaseFromBinary(new Uint8Array(await file.arrayBuffer()));
		}
	}

	async function exportDb(){
		const data = await exportDatabaseToBinary();
		const date = dayjs().format("YYYY-MM-DD");

		if('isTauri' in window){
			const path = await save({
				filters: [{
					name: `ampersand-backup-${date}`,
					extensions: ["ampdb"]
				}]
			});

			if(path)
				await writeFile(path, data);
		} else
			downloadBlob(data,`ampersand-backup-${date}.ampdb`);
	}

	async function importSettings(){
		const files = await getFiles(undefined, false);
		if (files.length) {
			const file = files[0];
			await importAppConfigFromBinary(new Uint8Array(await file.arrayBuffer()));
		}
	}
	async function exportSettings(){
		const data = await exportAppConfigToBinary();
		const date = dayjs().format("YYYY-MM-DD");
		if('isTauri' in window){
			const path = await save({
				filters: [{
					name: `ampersand-config-${date}`,
					extensions: ["ampcfg"]
				}]
			});

			if(path)
				await writeFile(path, data);
		} else
			downloadBlob(data, `ampersand-config-${date}.ampcfg`);
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>{{ $t("options:importExport.header") }}</IonTitle>
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
