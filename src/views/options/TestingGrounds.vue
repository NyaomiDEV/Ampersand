<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonItem,
		IonLabel,
		IonList,
		IonPage,
		IonTitle,
		IonToolbar,
		IonBackButton
	} from '@ionic/vue';
	import { inject } from 'vue';
	import { newSystem, getSystemUUID } from '../../lib/db/entities/system';

	const isIOS = inject<boolean>("isIOS");

	async function createTestSystem(){
		await newSystem({
			name: "Test System"
		});
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("testingGrounds:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList :inset="isIOS">
				<IonItem button @click="createTestSystem" v-if="!getSystemUUID()">
					<IonLabel>BEFORE EVERYTHING ELSE PLEASE CLICK HERE TO CREATE A TEST SYSTEM</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
