<script setup lang="ts">
	import { Member, SQLFile } from "../../lib/db/entities";
	import { getObjectURL } from "../../lib/util/blob";
	import { onBeforeMount, ref } from "vue";

	const props = defineProps<{
		member: Member,
	}>();

	const coverUri = ref();

	onBeforeMount(async () => {
		if(props.member.cover)
			coverUri.value = await getObjectURL(props.member.cover as SQLFile);
	});
</script>

<template>
	<img v-if="coverUri" aria-hidden="true" :src="coverUri" />
</template>
