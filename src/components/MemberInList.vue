<script setup lang="ts">
	import {
		IonItemSliding,
		IonItem,
		IonAvatar,
		IonLabel,
		IonItemOptions,
		IonItemOption,
	} from "@ionic/vue";

	import { Member, getTable } from '../lib/db/entities/members';
	import { getBlobURL } from '../lib/util/blob';
	import { tags } from "../lib/db/entities/tags";

	import TagChip from "./TagChip.vue";

	const props = defineProps<{
		member: Member,
		canDelete: boolean
	}>();

	const member = props.member;
	const canDelete = props.canDelete;

	async function removeFromDatabase() {
		await getTable().delete(member.uuid);
	}
</script>

<template>
	<IonItemSliding>
		<IonItem button>
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
				<div class="member-tags">
					<TagChip v-if="tags?.length" v-for="tag in member.tags" :tag="tags.find(x => x.uuid === tag)!" />
				</div>
			</IonLabel>
		</IonItem>
		<IonItemOptions>
			<IonItemOption v-if="canDelete" color="danger" @click="removeFromDatabase()">Delete</IonItemOption>
		</IonItemOptions>
	</IonItemSliding>
</template>

<style>
	ion-avatar.with-outline {
		outline-width: 2px;
		outline-style: solid;
	}
</style>