<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { Member } from '../../lib/db/entities/members';

	const props = defineProps<{
		member: Member,
	}>();
</script>

<template>
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
	</IonLabel>
</template>
