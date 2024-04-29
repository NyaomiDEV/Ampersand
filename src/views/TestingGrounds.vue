<script setup lang="ts">
import { IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { makeUUIDv5 } from '../lib/util/uuid';
import { ref } from 'vue';

const text = ref("");

function onInput(ev){
	text.value = makeUUIDv5(ev.detail.value);
	console.log(text.value);
}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonTitle>
					SHA1 test
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent color="light">
			<IonList :inset="true">
				<IonItem>
					<IonInput @ionInput="onInput" />
				</IonItem>
				<IonItem>
      				<IonLabel>{{ text }}</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
