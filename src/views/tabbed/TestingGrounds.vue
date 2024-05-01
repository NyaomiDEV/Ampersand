<script setup lang="ts">
	import { IonContent, IonHeader, IonInput, IonItem, IonItemDivider, IonItemOptions, IonItemOption, IonItemSliding, IonLabel, IonList, IonPage, IonTitle, IonToolbar, IonImg, IonAvatar } from '@ionic/vue';
	import { computed, ref } from 'vue';
	import { getFiles, isIOSMode } from '../../lib/util/misc';
	import { toObservable } from '../../lib/db';
	import { Member, getTable, newMember } from '../../lib/db/entities/members';
	import { getBlobURL } from '../../lib/util/blob';

	const isIOS = computed(isIOSMode);

	const name = ref("");

	async function testFile() {
		const files = await getFiles();
		console.log(files);
	}

	async function addToDatabase(){
		const files = await getFiles();
		console.log(files);
		newMember({
			name: name.value,
			image: files[0]!,
			isArchived: false,
			isCustomFront: false
		});
	}

	async function removeFromDatabase(member: Member) {
		const uuid = member.uuid;
		await getTable().delete(uuid);
	}

	const members = toObservable<Member[]>(() => getTable().toArray());
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
				<IonItem button @click="testFile">
					<IonLabel>test file interaction</IonLabel>
				</IonItem>
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
						<IonAvatar slot="start" v-if="member.image">
							<img aria-hidden="true" :src="getBlobURL(member.image)"
						</IonAvatar>
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
