<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonItem, IonLabel, IonPage, IonTitle, IonToolbar, IonBackButton} from '@ionic/vue';
	import { inject } from 'vue';
	import { importDatabaseFromBinary, exportDatabaseToBinary } from '../../lib/db/ioutils';
	import { downloadBlob, getFiles } from '../../lib/util/misc';
	import dayjs from 'dayjs';

	const isIOS = inject<boolean>("isIOS");

	async function importDb(){
		const files = await getFiles(undefined, false);
		if(files.length){
			const file = files[0];
			await importDatabaseFromBinary(new Uint8Array(await file.arrayBuffer()))
		}
	}

	async function exportDb(){
		const data = await exportDatabaseToBinary();
		const date = dayjs().format("YYYY-MM-DD");
		downloadBlob(data,`ampersand-backup-${date}.ampdb`);
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
						<h3>{{ $t("options:importExport.export.title") }}</h3>
						<p>{{ $t("options:importExport.export.desc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button @click="importDb" :detail="true">
					<IonLabel>
						<h3>{{ $t("options:importExport.import.title") }}</h3>
						<p>{{ $t("options:importExport.import.desc") }}</p>
					</IonLabel>				
				</IonItem>

			</IonList>
		</IonContent>
	</IonPage>
</template>
