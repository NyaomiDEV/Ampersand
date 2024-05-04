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
				<IonBackButton slot="start" />
				<IonTitle>
					Import / Export
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">

				<IonItem :detail="true">
					<IonLabel>
						<h3>Export your data</h3>
						<p>Backup your current data to a file you can store somewhere else</p>
					</IonLabel>
				</IonItem>

				<IonItem :detail="true">
					<IonLabel>
						<h3>Import your data from a backup file</h3>
						<p>Warning! It will override any existing data</p>
					</IonLabel>
				</IonItem>

			</IonList>
		</IonContent>
	</IonPage>
</template>
