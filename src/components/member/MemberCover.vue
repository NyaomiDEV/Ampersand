<script setup lang="ts">
	import { Member } from '../../lib/db/entities';
	import { getObjectURL } from '../../lib/util/blob';
	import { PartialBy } from "../../lib/types";

	const props = defineProps<{
		member: PartialBy<Member, "uuid" | "dateCreated">,
	}>();
</script>

<template>
	<img aria-hidden="true" :src="getObjectURL(props.member.cover)" v-if="props.member.cover" />
</template>
