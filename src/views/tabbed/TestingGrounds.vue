<script setup lang="ts">
	import { IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
	import { makeUUIDv5 } from '../../lib/util/uuid';
	import { computed, ref } from 'vue';
	import { isIOSMode } from '../../lib/util/misc';

	const text = ref("");

	const isIOS = computed(isIOSMode);

	function onInput(ev: any){
		text.value = makeUUIDv5(ev.detail.value);
		console.log(text.value);
	}
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
				<IonItem>
					<IonInput label="Name" labelPlacement="floating" @ionInput="onInput" />
				</IonItem>
				<IonItem>
					<IonLabel>{{ text }}</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
