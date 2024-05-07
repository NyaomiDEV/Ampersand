<script setup lang="ts">
	import {
		IonItemSliding,
		IonItem,
		IonAvatar,
		IonLabel,
		IonItemOptions,
		IonItemOption
	} from "@ionic/vue";

	import { Member, getTable } from '../lib/db/entities/members';
	import { getBlobURL } from '../lib/util/blob';

	const { member, canDelete } = defineProps<{
		member: Member,
		canDelete: boolean
	}>();

	async function removeFromDatabase() {
		await getTable().delete(member.uuid);
	}
</script>

<template>
	<IonItemSliding :key="member.uuid">
		<IonItem>
			<IonAvatar slot="start" v-if="member.image">
				<img aria-hidden="true" :src="getBlobURL(member.image)" />
			</IonAvatar>
			<IonLabel>
				<p>{{ member.role }}</p>
				<h2>{{ member.name }}</h2>
			</IonLabel>
			<!-- TODO: Add tags as chips -> @mecha-cat -->
		</IonItem>
		<IonItemOptions>
			<IonItemOption v-if="canDelete" color="danger" @click="removeFromDatabase()">Delete</IonItemOption>
		</IonItemOptions>
	</IonItemSliding>
</template>

<style>

</style>