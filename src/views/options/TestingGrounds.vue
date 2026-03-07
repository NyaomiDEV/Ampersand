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
	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import { newMember } from "../../lib/db/tables/members";
	import { appConfig } from "../../lib/config";

	async function generateThousands() {
		for(let i = 0; i < 100000; i++){
			console.log("GENERANDO", i);
			await newMember({
				system: appConfig.defaultSystem,
				name: `Member ${i}`,
				isPinned: false,
				isArchived: false,
				isCustomFront: false,
				tags: [],
				dateCreated: new Date()
			});
		}
		console.log("FATTO");
	}
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
				<IonItem @click="generateThousands()">
					<IonLabel>GENERA 100000 MEMBRI YOOOOOOOO</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
