<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonInput,
		IonItem,
		IonLabel,
		IonList,
		IonListHeader,
		IonPage,
		IonTextarea,
		IonTitle,
		IonToolbar
	} from '@ionic/vue';
	import { inject, ref } from 'vue';
	import { getFiles } from '../../lib/util/misc';
	import { newMember } from '../../lib/db/entities/members';
	import { resizeImage } from '../../lib/util/image';
	import { newSystem, getSystemUUID } from '../../lib/db/entities/system';

	const isIOS = inject<boolean>("isIOS");

	const name = ref("");
	const pronouns = ref("");
	const role = ref("");
	const description = ref("");

	async function createTestSystem(){
		await newSystem({
			name: "Test System"
		});
	}

	async function addToDatabase(){
		const files = await getFiles();
		newMember({
			name: name.value,
			image: await resizeImage(files[0]!)!,
			role: role.value,
			pronouns: pronouns.value,
			description: description.value,
			isArchived: false,
			isCustomFront: false
		});
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
				<IonItem button @click="createTestSystem" v-if="!getSystemUUID()">
					<IonLabel>BEFORE EVERYTHING ELSE PLEASE CLICK HERE TO CREATE A TEST SYSTEM</IonLabel>
				</IonItem>
			</IonList>

			<IonList :inset="isIOS" v-if="getSystemUUID()">
				<IonListHeader>
					Member test creation page
				</IonListHeader>
				<IonItem>
					<IonInput label="Name" labelPlacement="stacked" v-model="name" />
				</IonItem>
				<IonItem>
					<IonInput label="Pronouns" labelPlacement="stacked" v-model="pronouns" />
				</IonItem>
				<IonItem>
					<IonInput label="Role" labelPlacement="stacked" v-model="role" />
				</IonItem>
				<IonItem>
					<IonTextarea label="Description" labelPlacement="stacked" v-model="description" />
				</IonItem>
				<IonItem button @click="addToDatabase">
					<IonLabel>Create test member - you'll be prompted to select a member image</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
