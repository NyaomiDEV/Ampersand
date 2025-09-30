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
	} from "@ionic/vue";
	import { ref } from "vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";

	import ContentEditable from "../../components/ContentEditable.vue";

	const model = ref("ciao");
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					:icon="backMD"
					default-href="/options/"
				/>
				<IonTitle>
					Testing Grounds
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList>
				<ContentEditable v-model="model" label="test" />
				<IonItem>
					<IonLabel>Test</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
