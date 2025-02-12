<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonList,
		IonPage,
		IonTitle,
		IonToolbar,
		IonBackButton,
		IonItem,
		IonLabel
	} from '@ionic/vue';
	import { inject, ref } from 'vue';
	import ContentEditable from '../../components/ContentEditable.vue';

	const model = ref("ciao");

	const isIOS = inject<boolean>("isIOS");
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					Testing Grounds
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList :inset="isIOS">
				<ContentEditable v-model="model" label="test"/>
				<IonItem>
					<IonLabel>Test</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
