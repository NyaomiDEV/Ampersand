<script setup lang="ts">
	import {
		IonItemSliding,
		IonItem,
		IonAvatar,
		IonLabel,
		IonItemOptions,
	} from "@ionic/vue";

	import { Member } from '../lib/db/entities/members';
	import { getBlobURL } from '../lib/util/blob';
	import { tags } from "../lib/db/entities/tags";

	import TagChip from "./TagChip.vue";

	const props = defineProps<{
		member: Member,
	}>();

</script>

<template>
	<IonItemSliding>
		<IonItem button @click="(e) => $emit('memberClicked', e)">
			<IonAvatar class="with-outline" slot="start" :style="{ outlineColor: props.member.color }" v-if="props.member.image">
				<img aria-hidden="true" :src="getBlobURL(props.member.image)" />
			</IonAvatar>
			<IonLabel>
				<p>
					{{
						[
							props.member.role,
							props.member.isCustomFront ? $t("members:edit.customFront") : null,
							props.member.isArchived ? $t("members:edit.archived") : null
						].filter(Boolean).join(" - ")
					}}
				</p>
				<h2>
					{{ props.member.name }}
				</h2>
				<div class="member-tags">
					<TagChip v-if="tags?.length" v-for="tag in props.member.tags" :tag="tags.find(x => x.uuid === tag)!" />
				</div>
			</IonLabel>
		</IonItem>
		<IonItemOptions>
			<slot name="options"></slot>
		</IonItemOptions>
	</IonItemSliding>
</template>

<style>
	ion-avatar.with-outline {
		outline-width: 2px;
		outline-style: solid;
	}
</style>