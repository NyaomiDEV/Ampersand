<script setup lang="ts">
	import { IonIcon } from "@ionic/vue";
	import emptyStar from "@material-symbols/svg-600/rounded/star.svg";
	import halfStar from "@material-symbols/svg-600/rounded/star_half.svg";
	import fullStar from "@material-symbols/svg-600/rounded/star-fill.svg";
	import { h, shallowRef, VNode, watch } from "vue";

	const props = defineProps<{
		rating: number
	}>();

	const stars = shallowRef<VNode[]>([]);

	watch(props, () => {
		const _stars: VNode[] = [];

		for (let i = 0; i < 10; i+=2) {
			if (i < props.rating) {
				if (i+1 < props.rating) 
					_stars.push(h(IonIcon, { icon: fullStar }));
				else 
					_stars.push(h(IonIcon, { icon: halfStar }));
			} else 
				_stars.push(h(IonIcon, { icon: emptyStar }));
		}

		stars.value = _stars;
	}, { immediate: true });
</script>

<template>
	<span class="rating">
		<component :is="star" v-for="star in stars" :key="star.key" />
	</span>
</template>
