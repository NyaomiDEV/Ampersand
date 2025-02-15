<script setup lang="ts">
	const props = withDefaults(defineProps<{
		size?: string,
		color?: string
	}>(), {
		size: "48px",
		color: "var(--ion-color-primary)"
	});
</script>

<template>
	<div class="parent">
		<div class="spinner">
			<div class="left">
				<div class="circle"></div>
			</div>
			<div class="right">
				<div class="circle"></div>
			</div>
		</div>
	</div>
</template>

<style scoped>
	.parent {
		display: inline-flex;
		vertical-align: middle;
		width: v-bind('props.size');
		height: v-bind('props.size');
		position: relative;
		align-items: center;
		justify-content: center;
		contain: strict;
		content-visibility: auto;
		animation: linear infinite linear-rotate;
		animation-duration: 1568.2352941176ms;
	}

	.spinner {
		animation: infinite both rotate-arc;
		animation-duration: 5332ms;
		animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	}

	.spinner, .left, .right, .circle {
		position: absolute;
		inset: 0;
	}

	.left {
		overflow: hidden;
		inset: 0 50% 0 0;
	}

	.right {
		overflow: hidden;
		inset: 0 0 0 50%;
	}

	.circle {
		box-sizing: border-box;
		border-radius: 50%;
		border: solid;
		border-width: calc(v-bind('props.size') / 12);
		border-color: v-bind('props.color') v-bind('props.color')
			rgba(0, 0, 0, 0) rgba(0, 0, 0, 0);
		animation: expand-arc;
		animation-iteration-count: infinite;
		animation-fill-mode: both;
		animation-duration: 1333ms, 5332ms;
		animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	}

	.left .circle {
		rotate: 135deg;
		inset: 0 -100% 0 0;
	}

	.right .circle {
		rotate: 100deg;
		inset: 0 0 0 -100%;
		animation-delay: -666.5ms, 0ms;
	}

	@keyframes expand-arc {
		0% {
			transform: rotate(265deg);
		}
		50% {
			transform: rotate(130deg);
		}
		100% {
			transform: rotate(265deg);
		}
	}

	@keyframes rotate-arc {
		12.5% {
			transform: rotate(135deg);
		}
		25% {
			transform: rotate(270deg);
		}
		37.5% {
			transform: rotate(405deg);
		}
		50% {
			transform: rotate(540deg);
		}
		62.5% {
			transform: rotate(675deg);
		}
		75% {
			transform: rotate(810deg);
		}
		87.5% {
			transform: rotate(945deg);
		}
		100% {
			transform: rotate(1080deg);
		}
	}

	@keyframes linear-rotate {
		to {
			transform: rotate(360deg);
		}
	}
</style>