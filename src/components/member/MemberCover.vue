<script setup lang="ts">
	import { Member } from "../../lib/db/entities";
	import { getObjectURL } from "../../lib/util/blob";
	import { PartialBy } from "../../lib/types";
	import { onBeforeMount, ref } from "vue";

	const props = defineProps<{
		member: PartialBy<Member, "id" | "dateCreated">,
	}>();

	const coverUri = ref();

	onBeforeMount(async () => {
		if(props.member.cover)
			coverUri.value = await getObjectURL(props.member.cover);
	});
</script>

<template>
	<img v-if="coverUri" aria-hidden="true" :src="coverUri" />
</template>
