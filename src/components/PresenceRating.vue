<script setup lang="ts">
	import { IonIcon } from "@ionic/vue";
	import emptyStar from "@material-symbols/svg-600/rounded/star.svg";
	import halfStar from "@material-symbols/svg-600/rounded/star_half.svg";
	import fullStar from "@material-symbols/svg-600/rounded/star-fill.svg";
	import { h, VNode } from "vue";

	const props = defineProps<{
		rating: number
	}>();

	const stars: VNode[] = [];

	for (let i = 0; i < 10; i+=2) {
		if (i < props.rating) {
			if (i+1 < props.rating) 
				stars.push(h(IonIcon, { icon: fullStar }));
			else 
				stars.push(h(IonIcon, { icon: halfStar }));
		} else 
			stars.push(h(IonIcon, { icon: emptyStar }));
	}
</script>

<template>
	<span class="rating">
		<component :is="star" v-for="star in stars" :key="star.key" />
	</span>
</template>
