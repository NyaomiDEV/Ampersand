<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonButton, IonBackButton} from '@ionic/vue';
	import { computed } from 'vue';
	import { isIOSIonicMode } from '../../lib/mode';

	const isIOS = computed(isIOSIonicMode);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonButton slot="start">
					<IonBackButton />
				</IonButton>
				<IonTitle>
					Front history
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">

			</IonList>
		</IonContent>
	</IonPage>
</template>