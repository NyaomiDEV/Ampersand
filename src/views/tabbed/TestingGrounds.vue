<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonInput,
		IonItem,
		IonItemOptions,
		IonItemOption,
		IonItemSliding,
		IonLabel,
		IonList,
		IonListHeader,
		IonPage,
		IonTitle,
		IonToolbar,
		IonAvatar
	} from '@ionic/vue';
	import { computed, ref } from 'vue';
	import { getFiles } from '../../lib/util/misc';
	import { isIOSIonicMode } from '../../lib/mode';
	import { Member, getTable, newMember } from '../../lib/db/entities/members';
	import { getBlobURL } from '../../lib/util/blob';
	import { resizeImage } from '../../lib/util/image';
	import { getFilteredMembers } from '../../lib/db/liveQueries';

	const isIOS = computed(isIOSIonicMode);

	const name = ref("");
	const search = ref("");

	async function addToDatabase(){
		const files = await getFiles();
		console.log(files);
		newMember({
			name: name.value,
			image: await resizeImage(files[0]!)!,
			isArchived: false,
			isCustomFront: false
		});
	}

	async function removeFromDatabase(member: Member) {
		const uuid = member.uuid;
		await getTable().delete(uuid);
	}

	const members = getFilteredMembers(search);
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
					<IonInput label="Name" labelPlacement="stacked" v-model="name" />
				</IonItem>
				<IonItem button @click="addToDatabase">
					<IonLabel>Create test member</IonLabel>
				</IonItem>
			</IonList>

			<IonListHeader>
				<IonLabel>Members</IonLabel>
			</IonListHeader>
			<IonList :inset="isIOS">
				<IonItem>
					<IonInput label="Search" labelPlacement="stacked" v-model="search" />
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
