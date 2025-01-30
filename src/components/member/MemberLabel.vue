<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { Member } from '../../lib/db/entities';

	const props = defineProps<{
		member: Member,
	}>();
</script>

<template>
	<IonLabel class="nowrap">
		<p>
			{{
				[
					props.member.isCustomFront ? $t("members:edit.customFront") : null,
					props.member.role,
				].filter(Boolean).join(" - ")
			}}
		</p>
		<h2>
			{{ props.member.name }}
		</h2>
	</IonLabel>
</template>
