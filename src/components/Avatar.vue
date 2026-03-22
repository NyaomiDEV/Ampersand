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
		withOutline?: boolean
	}>(), { withOutline: true });
	
	const avatarColor = ref("var(--ion-color-primary)");
	watch(props, () => {
		avatarColor.value = props.color || "var(--ion-color-primary)";
	}, { immediate: true });
</script>

<template>
	<IonAvatar
		v-if="props.image"
		:class="[
			'avatar',
			{ 'with-outline': props.withOutline && accessibilityConfig.colorIndicatorPosition === 'avatar' },
			{ 'with-shape': !!props.clipShape },
			{ [`shape-${props.clipShape}`]: !!props.clipShape }
		]"
	>
		<img aria-hidden="true" :src="getObjectURL(props.image)" />
	</IonAvatar>
	<IonIcon
		v-else
		:class="['avatar', {
			'with-color': props.withOutline && accessibilityConfig.colorIndicatorPosition === 'avatar'
		}]"
		:icon="props.icon"
	/>
</template>

<style scoped>
	.avatar {
		width: 56px;
		height: 56px;
	}

	.with-color {
		color: v-bind('avatarColor') !important;
	}

	ion-avatar {
		position: relative;
	}

	ion-avatar.with-outline {
		outline-width: 2px;
		outline-style: solid;
		outline-color: v-bind('avatarColor');
		background-color: v-bind('avatarColor');
	}

	ion-avatar.with-shape {
		--border-radius: 0px;

		&.with-outline {
			outline-style: none;
			background-color: unset;
		}

		&.with-outline::before {
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

		img {
			mask-repeat: no-repeat;
			mask-position: center;
			mask-size: contain;
		};

		&.with-outline img {
			transform: scale(90%);
			z-index: 1;
		}

		&.shape-arch img, &.shape-arch::before {
			mask-image: url(../assets/shapes/arch.svg);
		}
		&.shape-arrow img, &.shape-arrow::before {
			mask-image: url(../assets/shapes/arrow.svg);
		}
		&.shape-boom img, &.shape-boom::before {
			mask-image: url(../assets/shapes/boom.svg);
		}
		&.shape-bun img, &.shape-bun::before {
			mask-image: url(../assets/shapes/bun.svg);
		}
		&.shape-burst img, &.shape-burst::before {
			mask-image: url(../assets/shapes/burst.svg);
		}
		&.shape-clamshell img, &.shape-clamshell::before {
			mask-image: url(../assets/shapes/clamshell.svg);
		}
		&.shape-diamond img, &.shape-diamond::before {
			mask-image: url(../assets/shapes/diamond.svg);
		}
		&.shape-fan img, &.shape-fan::before {
			mask-image: url(../assets/shapes/fan.svg);
		}
		&.shape-flower img, &.shape-flower::before {
			mask-image: url(../assets/shapes/flower.svg);
		}
		&.shape-gem img, &.shape-gem::before {
			mask-image: url(../assets/shapes/gem.svg);
		}
		&.shape-ghost-ish img, &.shape-ghost-ish::before {
			mask-image: url(../assets/shapes/ghost-ish.svg);
		}
		&.shape-heart img, &.shape-heart::before {
			mask-image: url(../assets/shapes/heart.svg);
		}
		&.shape-leaf-clover4 img, &.shape-leaf-clover4::before {
			mask-image: url(../assets/shapes/leaf-clover4.svg);
		}
		&.shape-leaf-clover8 img, &.shape-leaf-clover8::before {
			mask-image: url(../assets/shapes/leaf-clover8.svg);
		}
		&.shape-oval img, &.shape-oval::before {
			mask-image: url(../assets/shapes/oval.svg);
		}
		&.shape-pentagon img, &.shape-pentagon::before {
			mask-image: url(../assets/shapes/pentagon.svg);
		}
		&.shape-pill img, &.shape-pill::before {
			mask-image: url(../assets/shapes/pill.svg);
		}
		&.shape-pixel-circle img, &.shape-pixel-circle::before {
			mask-image: url(../assets/shapes/pixel-circle.svg);
		}
		&.shape-pixel-triangle img, &.shape-pixel-triangle::before {
			mask-image: url(../assets/shapes/pixel-triangle.svg);
		}
		&.shape-puffy-diamond img, &.shape-puffy-diamond::before {
			mask-image: url(../assets/shapes/puffy-diamond.svg);
		}
		&.shape-puffy img, &.shape-puffy::before {
			mask-image: url(../assets/shapes/puffy.svg);
		}
		&.shape-semicircle img, &.shape-semicircle::before {
			mask-image: url(../assets/shapes/semicircle.svg);
		}
		&.shape-sided-cookie12 img, &.shape-sided-cookie12::before {
			mask-image: url(../assets/shapes/sided-cookie12.svg);
		}
		&.shape-sided-cookie4 img, &.shape-sided-cookie4::before {
			mask-image: url(../assets/shapes/sided-cookie4.svg);
		}
		&.shape-sided-cookie6 img, &.shape-sided-cookie6::before {
			mask-image: url(../assets/shapes/sided-cookie6.svg);
		}
		&.shape-sided-cookie7 img, &.shape-sided-cookie7::before {
			mask-image: url(../assets/shapes/sided-cookie7.svg);
		}
		&.shape-sided-cookie9 img, &.shape-sided-cookie9::before {
			mask-image: url(../assets/shapes/sided-cookie9.svg);
		}
		&.shape-slanted img, &.shape-slanted::before {
			mask-image: url(../assets/shapes/slanted.svg);
		}
		&.shape-soft-boom img, &.shape-soft-boom::before {
			mask-image: url(../assets/shapes/soft-boom.svg);
		}
		&.shape-soft-burst img, &.shape-soft-burst::before {
			mask-image: url(../assets/shapes/soft-burst.svg);
		}
		&.shape-square img, &.shape-square::before {
			mask-image: url(../assets/shapes/square.svg);
		}
		&.shape-sunny img, &.shape-sunny::before {
			mask-image: url(../assets/shapes/sunny.svg);
		}
		&.shape-triangle img, &.shape-triangle::before {
			mask-image: url(../assets/shapes/triangle.svg);
		}
		&.shape-very-sunny img, &.shape-very-sunny::before {
			mask-image: url(../assets/shapes/very-sunny.svg);
		}
	}
</style>