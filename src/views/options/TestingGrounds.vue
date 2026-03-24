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
		IonLabel,
		IonListHeader
	} from "@ionic/vue";
	import { newMember } from "../../lib/db/tables/members";
	import { appConfig } from "../../lib/config";
	import { newTag } from "../../lib/db/tables/tags";
	import { newSystem } from "../../lib/db/tables/system";

	async function genMembers() {
		for(let i = 0; i < 100; i++){
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
	}

	async function genTags() {
		for(let i = 0; i < 100; i++){
			await newTag({
				name: `Tag ${i}`,
				type: "member",
				viewInLists: false
			});
		}
	}

	async function genSystems() {
		for(let i = 0; i < 100; i++){
			await newSystem({
				name: `System ${i}`,
				isPinned: false,
				isArchived: false
			});
		}
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					default-href="/options/"
				/>
				<IonTitle>
					Testing Grounds
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonListHeader>Stress testing</IonListHeader>
			<IonList>
				<IonItem button detail @click="genMembers()">
					<IonLabel>Make 100 members</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
