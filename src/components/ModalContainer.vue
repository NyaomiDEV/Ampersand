<script setup lang="ts">
	import { withDirectives } from "vue";
	import { useModalContainer } from "../lib/modals";

	const { renderArray, modalDirective } = useModalContainer();
</script>

<template>
	<component
		:is="() => 
			renderArray.map(x => withDirectives(x, [
				[modalDirective, { originalVnode: x }]
			]))
		"
	/>
</template>