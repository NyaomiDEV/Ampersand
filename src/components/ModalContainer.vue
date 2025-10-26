<script setup lang="ts">
	import { withDirectives } from "vue";
	import { useModalContainer } from "../lib/modals";

	const { renderArray, modalDirective } = useModalContainer();
</script>

<template>
	<span v-for="item in renderArray" :key="renderArray.indexOf(item)">
		<component
			:is="withDirectives(item, [
				[modalDirective, { originalVnode: item }]
			])"
		/>
	</span>
</template>