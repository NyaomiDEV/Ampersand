<script setup lang="ts">
	import { IonContent, IonHeader, IonInput, IonItem, IonItemDivider, IonItemOptions, IonItemOption, IonItemSliding, IonLabel, IonList, IonListHeader, IonPage, IonTitle, IonToolbar, IonAvatar } from '@ionic/vue';
	import { computed, ref } from 'vue';
	import { getFiles, isIOSMode } from '../../lib/util/misc';
	import { Member, getMembersFromFilterQuery, getTable, newMember } from '../../lib/db/entities/members';
	import { getBlobURL } from '../../lib/util/blob';
	import { useDexieLiveQueryWithDeps } from '../../lib/util/liveQuery';

	const isIOS = computed(isIOSMode);

	const name = ref("");
	const search = ref("");

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

	const members = useDexieLiveQueryWithDeps(search, async (search: string) => (await getMembersFromFilterQuery(search)).toArray())
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
			</IonList>

			<IonList :inset="isIOS">
				<IonListHeader>
					<IonLabel>Members</IonLabel>
				</IonListHeader>
				<IonItem>
					<IonInput label="Search" labelPlacement="floating" v-model="search" />
				</IonItem>
				<IonItemSliding v-for="member of members" :key="member.uuid">
					<IonItem>
						<IonAvatar slot="start" v-if="member.image">
							<img aria-hidden="true" :src="getBlobURL(member.image)" </IonAvatar>
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
