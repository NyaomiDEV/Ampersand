<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonNavLink, IonBackButton} from '@ionic/vue';
	import { computed } from 'vue';
	import { isIOSMode } from '../../lib/util/misc';

	const isIOS = computed(isIOSMode);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonButton slot="start">
					<IonBackButton />
				</IonButton>
				<IonTitle>
					Message board
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">

			</IonList>
		</IonContent>
	</IonPage>
</template>
