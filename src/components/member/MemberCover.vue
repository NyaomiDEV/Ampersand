<script setup lang="ts">
	import { Member } from "../../lib/db/entities";
	import { getObjectURL } from "../../lib/util/blob";
	import { PartialBy } from "../../lib/types";

	const props = defineProps<{
		member: PartialBy<Member, "id" | "dateCreated">,
	}>();
</script>

<template>
	<img v-if="props.member.cover" aria-hidden="true" :src="getObjectURL(props.member.cover)" />
</template>
