<script setup lang="ts">
	import {
		IonAvatar,
		IonIcon,
	} from "@ionic/vue";

	import { accessibilityConfig } from "../lib/config";
	import { ImageClip } from "../lib/db/entities";
	import { useBlob } from "../lib/util/blob";

	import { ref, watch } from "vue";

	const { getObjectURL } = useBlob();

	const props = withDefaults(defineProps<{
		image?: File,
		clipShape?: ImageClip,
		color?: string,
		icon?: string,
		withOutline?: boolean,
		smaller?: boolean
	}>(), { withOutline: true });
	
	const avatarColor = ref("var(--ion-color-primary)");
	watch(props, () => {
		avatarColor.value = props.color || "var(--ion-color-primary)";
	}, { immediate: true });
</script>

<template>
	<div
		:class="[
			'avatar',
			{ 'smaller': !!props.smaller },
			{ 'with-outline': props.withOutline && accessibilityConfig.colorIndicatorPosition === 'avatar' },
			{ 'with-shape': !!props.clipShape },
			{ [`shape-${props.clipShape}`]: !!props.clipShape },
		]"
	>
		<IonAvatar v-if="props.image">
			<img aria-hidden="true" :src="getObjectURL(props.image)" />
		</IonAvatar>
		<IonIcon v-else :icon="props.icon" />
		<div class="subavatar">
			<slot />
		</div>
	</div>
</template>

<style scoped>
	.avatar {
		width: 56px;
		height: 56px;
		position: relative;
		z-index: 0;

		&.smaller {
			width: 48px;
			height: 48px;
		}

		> .subavatar {
			position: absolute;
			bottom: 0;
			z-index: 1;
			transform: scale(0.4);
			transform-origin: 100% 100%;
		}

		> * {
			width: 100%;
			height: 100%;
		}

		> ion-icon {
			color: v-bind('avatarColor') !important;
		}

		&.with-outline > ion-avatar {
			outline-width: 2px;
			outline-style: solid;
			outline-color: v-bind('avatarColor');
			background-color: v-bind('avatarColor');
		}

		&.with-shape > ion-avatar {
			--border-radius: 0px;
		}

		&.with-shape.with-outline > ion-avatar {
			outline-style: none;
			background-color: unset;
		}

		&.with-shape.with-outline > ion-avatar::before {
			position: absolute;
			width: calc(100%);
			height: calc(100%);
			top: 0px;
			left: 0px;
			content: "\A";
			background-color: v-bind('avatarColor');

			mask-repeat: no-repeat;
			mask-position: center;
			mask-size: contain;
			z-index: 0;
		}

		&.with-shape > ion-avatar > img {
			mask-repeat: no-repeat;
			mask-position: center;
			mask-size: contain;
		}

		&.with-shape.with-outline > ion-avatar > img {
			transform: scale(90%);
			z-index: 1;
		}

		&.with-shape.shape-arch > ion-avatar > img, &.with-shape.shape-arch > ion-avatar::before {
			mask-image: url(../assets/shapes/arch.svg);
		}
		&.with-shape.shape-arrow > ion-avatar > img, &.with-shape.shape-arrow > ion-avatar::before {
			mask-image: url(../assets/shapes/arrow.svg);
		}
		&.with-shape.shape-boom > ion-avatar > img, &.with-shape.shape-boom > ion-avatar::before {
			mask-image: url(../assets/shapes/boom.svg);
		}
		&.with-shape.shape-bun > ion-avatar > img, &.with-shape.shape-bun > ion-avatar::before {
			mask-image: url(../assets/shapes/bun.svg);
		}
		&.with-shape.shape-burst > ion-avatar > img, &.with-shape.shape-burst > ion-avatar::before {
			mask-image: url(../assets/shapes/burst.svg);
		}
		&.with-shape.shape-clamshell > ion-avatar > img, &.with-shape.shape-clamshell > ion-avatar::before {
			mask-image: url(../assets/shapes/clamshell.svg);
		}
		&.with-shape.shape-diamond > ion-avatar > img, &.with-shape.shape-diamond > ion-avatar::before {
			mask-image: url(../assets/shapes/diamond.svg);
		}
		&.with-shape.shape-fan > ion-avatar > img, &.with-shape.shape-fan > ion-avatar::before {
			mask-image: url(../assets/shapes/fan.svg);
		}
		&.with-shape.shape-flower > ion-avatar > img, &.with-shape.shape-flower > ion-avatar::before {
			mask-image: url(../assets/shapes/flower.svg);
		}
		&.with-shape.shape-gem > ion-avatar > img, &.with-shape.shape-gem > ion-avatar::before {
			mask-image: url(../assets/shapes/gem.svg);
		}
		&.with-shape.shape-ghost-ish > ion-avatar > img, &.with-shape.shape-ghost-ish > ion-avatar::before {
			mask-image: url(../assets/shapes/ghost-ish.svg);
		}
		&.with-shape.shape-heart > ion-avatar > img, &.with-shape.shape-heart > ion-avatar::before {
			mask-image: url(../assets/shapes/heart.svg);
		}
		&.with-shape.shape-leaf-clover4 > ion-avatar > img, &.with-shape.shape-leaf-clover4 > ion-avatar::before {
			mask-image: url(../assets/shapes/leaf-clover4.svg);
		}
		&.with-shape.shape-leaf-clover8 > ion-avatar > img, &.with-shape.shape-leaf-clover8 > ion-avatar::before {
			mask-image: url(../assets/shapes/leaf-clover8.svg);
		}
		&.with-shape.shape-oval > ion-avatar > img, &.with-shape.shape-oval > ion-avatar::before {
			mask-image: url(../assets/shapes/oval.svg);
		}
		&.with-shape.shape-pentagon > ion-avatar > img, &.with-shape.shape-pentagon > ion-avatar::before {
			mask-image: url(../assets/shapes/pentagon.svg);
		}
		&.with-shape.shape-pill > ion-avatar > img, &.with-shape.shape-pill > ion-avatar::before {
			mask-image: url(../assets/shapes/pill.svg);
		}
		&.with-shape.shape-pixel-circle > ion-avatar > img, &.with-shape.shape-pixel-circle > ion-avatar::before {
			mask-image: url(../assets/shapes/pixel-circle.svg);
		}
		&.with-shape.shape-pixel-triangle > ion-avatar > img, &.with-shape.shape-pixel-triangle > ion-avatar::before {
			mask-image: url(../assets/shapes/pixel-triangle.svg);
		}
		&.with-shape.shape-puffy-diamond > ion-avatar > img, &.with-shape.shape-puffy-diamond > ion-avatar::before {
			mask-image: url(../assets/shapes/puffy-diamond.svg);
		}
		&.with-shape.shape-puffy > ion-avatar > img, &.with-shape.shape-puffy > ion-avatar::before {
			mask-image: url(../assets/shapes/puffy.svg);
		}
		&.with-shape.shape-semicircle > ion-avatar > img, &.with-shape.shape-semicircle > ion-avatar::before {
			mask-image: url(../assets/shapes/semicircle.svg);
		}
		&.with-shape.shape-sided-cookie12 > ion-avatar > img, &.with-shape.shape-sided-cookie12 > ion-avatar::before {
			mask-image: url(../assets/shapes/sided-cookie12.svg);
		}
		&.with-shape.shape-sided-cookie4 > ion-avatar > img, &.with-shape.shape-sided-cookie4 > ion-avatar::before {
			mask-image: url(../assets/shapes/sided-cookie4.svg);
		}
		&.with-shape.shape-sided-cookie6 > ion-avatar > img, &.with-shape.shape-sided-cookie6 > ion-avatar::before {
			mask-image: url(../assets/shapes/sided-cookie6.svg);
		}
		&.with-shape.shape-sided-cookie7 > ion-avatar > img, &.with-shape.shape-sided-cookie7 > ion-avatar::before {
			mask-image: url(../assets/shapes/sided-cookie7.svg);
		}
		&.with-shape.shape-sided-cookie9 > ion-avatar > img, &.with-shape.shape-sided-cookie9 > ion-avatar::before {
			mask-image: url(../assets/shapes/sided-cookie9.svg);
		}
		&.with-shape.shape-slanted > ion-avatar > img, &.with-shape.shape-slanted > ion-avatar::before {
			mask-image: url(../assets/shapes/slanted.svg);
		}
		&.with-shape.shape-soft-boom > ion-avatar > img, &.with-shape.shape-soft-boom > ion-avatar::before {
			mask-image: url(../assets/shapes/soft-boom.svg);
		}
		&.with-shape.shape-soft-burst > ion-avatar > img, &.with-shape.shape-soft-burst > ion-avatar::before {
			mask-image: url(../assets/shapes/soft-burst.svg);
		}
		&.with-shape.shape-square > ion-avatar > img, &.with-shape.shape-square > ion-avatar::before {
			mask-image: url(../assets/shapes/square.svg);
		}
		&.with-shape.shape-sunny > ion-avatar > img, &.with-shape.shape-sunny > ion-avatar::before {
			mask-image: url(../assets/shapes/sunny.svg);
		}
		&.with-shape.shape-triangle > ion-avatar > img, &.with-shape.shape-triangle > ion-avatar::before {
			mask-image: url(../assets/shapes/triangle.svg);
		}
		&.with-shape.shape-very-sunny > ion-avatar > img, &.with-shape.shape-very-sunny > ion-avatar::before {
			mask-image: url(../assets/shapes/very-sunny.svg);
		}
	}
</style>