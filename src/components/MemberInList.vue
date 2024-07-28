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
	import MemberEdit from "../modals/MemberEdit.vue";
	import { provide, ref } from "vue";

	const props = defineProps<{
		member: Member,
		canDelete: boolean
	}>();

	const member = props.member;
	const canDelete = props.canDelete;
	const isOpen = ref(false);
	provide("isOpen", isOpen);

	async function removeFromDatabase() {
		await getTable().delete(member.uuid);
	}
</script>

<template>
	<IonItemSliding>
		<IonItem button @click="isOpen = true">
			<IonAvatar class="with-outline" slot="start" :style="{ outlineColor: member.color }" v-if="member.image">
				<img aria-hidden="true" :src="getBlobURL(member.image)" />
			</IonAvatar>
			<IonLabel>
				<p>
					{{
						[
							member.role,
							member.isCustomFront ? $t("members:edit.customFront") : null,
							member.isArchived ? $t("members:edit.archived") : null
						].filter(Boolean).join(" - ")
					}}
				</p>
				<h2>
					{{ member.name }}
				</h2>
			</IonLabel>
			<!-- TODO: Add tags as chips -> @mecha-cat -->
		</IonItem>
		<IonItemOptions>
			<IonItemOption v-if="canDelete" color="danger" @click="removeFromDatabase()">Delete</IonItemOption>
		</IonItemOptions>
	</IonItemSliding>

	<MemberEdit :add="false" :edit="false" :member="member" />
</template>

<style>
	ion-avatar.with-outline {
		outline-width: 2px;
		outline-style: solid;
	}
</style>