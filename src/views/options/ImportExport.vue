<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonItem, IonLabel, IonPage, IonTitle, IonToolbar, IonBackButton} from '@ionic/vue';
	import { inject } from 'vue';
	import { importDatabaseFromBinary, exportDatabaseFromBinary } from '../../db/ioutils';

	const isIOS = inject<boolean>("isIOS");
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
