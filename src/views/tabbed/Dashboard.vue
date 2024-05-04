<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
	import { computed } from 'vue';
	import { isIOSIonicMode } from '../../lib/mode';

	const isIOS = computed(isIOSIonicMode);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonTitle>
					Dashboard
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">

			</IonList>
		</IonContent>
	</IonPage>
</template>
