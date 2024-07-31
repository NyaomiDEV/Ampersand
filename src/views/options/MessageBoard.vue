<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton} from '@ionic/vue';
	import { inject } from 'vue';

	import NotDoneYet from "../../components/NotDoneYet.vue";

	const isIOS = inject<boolean>("isIOS");
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:messageBoard.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<NotDoneYet />
			<IonList :inset="isIOS" v-if="false">
			</IonList>
		</IonContent>
	</IonPage>
</template>
