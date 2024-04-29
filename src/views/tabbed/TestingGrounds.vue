<script setup lang="ts">
	import { IonContent, IonHeader, IonInput, IonItem, IonItemDivider, IonItemOptions, IonItemOption, IonItemSliding, IonLabel, IonList, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
	import { computed, ref } from 'vue';
	import { isIOSMode } from '../../lib/util/misc';
	import { toObservable } from '../../lib/db';
	import { Member, getTable, newMember } from '../../lib/db/entities/members';

	const isIOS = computed(isIOSMode);

	const name = ref("");

	async function addToDatabase(){
		newMember({
			name: name.value,
			isArchived: false,
			isCustomFront: false
		});
	}

	async function removeFromDatabase(member: Member) {
		const uuid = member.uuid;
		await getTable().delete(uuid);
	}

	const members = toObservable(() => getTable().toArray());
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
					<IonInput label="Name" labelPlacement="floating" v-model="name" />
				</IonItem>
				<IonItem button @click="addToDatabase">
					<IonLabel>Create test member</IonLabel>
				</IonItem>
				<IonItemDivider>
					<IonLabel>
						members
					</IonLabel>
				</IonItemDivider>
				<IonItemSliding v-for="member of members" :key="member.uuid">
					<IonItem>
						<IonLabel>{{ member.name }}</IonLabel>
					</IonItem>
					<IonItemOptions>
						<IonItemOption color="danger" @click="removeFromDatabase(member)">Delete</IonItemOption>
					</IonItemOptions>
				</IonItemSliding>
			</IonList>
		</IonContent>
	</IonPage>
</template>
