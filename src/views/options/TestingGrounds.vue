<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonList,
		IonPage,
		IonTitle,
		IonToolbar,
		IonBackButton
	} from '@ionic/vue';
	import { inject } from 'vue';

	const isIOS = inject<boolean>("isIOS");

	function test(e: Event){
		e.preventDefault();
	}
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
				<div @click="test">
					ciao <a href="https://google.com">ciaone</a> aaaaa
				</div>
			</IonList>
		</IonContent>
	</IonPage>
</template>
