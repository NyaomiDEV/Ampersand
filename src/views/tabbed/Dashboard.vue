<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
	import { computed } from 'vue';
	import { isIOSMode } from '../../lib/util/misc';

	const isIOS = computed(isIOSMode);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonTitle>
					{{ $t("testingGrounds:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">

			</IonList>
		</IonContent>
	</IonPage>
</template>
