<script setup lang="ts">
	const props = defineProps<{
		duration?: number,
		bouncy?: boolean,
		direction: string
	}>();
	
	const finalDuration = props.duration
		? `${props.duration}s`
		: (["top", "bottom"].includes(props.direction)
			? props.bouncy ? "4s" : "2s"
			: props.bouncy ? "20s" : "10s"
		);
</script>

<template>
	<div class="marquee-container">
		<span class="marquee" :data-direction="direction" :data-bouncy="bouncy || undefined">
			<slot />
		</span>
	</div>
</template>

<style scoped>

	.marquee-container {
		display: block;
		overflow: hidden;
	}
		
    .marquee {
		display: block;
		animation-iteration-count: infinite;
		animation-timing-function: linear;
		min-width: 100%;
		width: min-content;
		text-align: center;
		white-space: nowrap;
		animation-duration: v-bind('finalDuration');
	}

    .marquee[data-direction=left] {
        animation-name: marquee-to-left;
    }

    .marquee[data-direction=left][data-bouncy] {
        animation-name: marquee-to-left-bouncy;
    }

    .marquee[data-direction=right] {
        animation-name: marquee-to-right;
    }

    .marquee[data-direction=right][data-bouncy] {
        animation-name: marquee-to-right-bouncy;
    }

    .marquee[data-direction=top] {
        animation-name: marquee-to-top;
    }

    .marquee[data-direction=top][data-bouncy] {
        animation-name: marquee-to-top-bouncy;
    }

    .marquee[data-direction=bottom] {
        animation-name: marquee-to-bottom;
    }

    .marquee[data-direction=bottom][data-bouncy] {
        animation-name: marquee-to-bottom-bouncy;
    }

    @keyframes marquee-to-left {
	    from {
		    transform: translateX(100%);
	    }
	    to {
		    transform: translateX(-100%);
	    }
    }

    @keyframes marquee-to-left-bouncy {
	    0%, 100% {
		    transform: translateX(100%);
	    }
	    50% {
		    transform: translateX(-100%);
	    }
    }

    @keyframes marquee-to-right {
	    from {
		    transform: translateX(-100%);
	    }
	    to {
		    transform: translateX(100%);
	    }
    }

    @keyframes marquee-to-right-bouncy {
	    0%, 100% {
		    transform: translateX(-100%);
	    }
	    50% {
		    transform: translateX(100%);
	    }
    }

    @keyframes marquee-to-top {
	    from {
		    transform: translateY(100%);
	    }
	    to {
		    transform: translateY(-100%);
	    }
    }

    @keyframes marquee-to-top-bouncy {
	    0%, 100% {
		    transform: translateY(100%);
	    }
	    50% {
		    transform: translateY(-100%);
	    }
    }

    @keyframes marquee-to-bottom {
	    from {
		    transform: translateY(-100%);
	    }
	    to {
		    transform: translateY(100%);
	    }
    }

    @keyframes marquee-to-bottom-bouncy {
	    0%, 100% {
		    transform: translateY(-100%);
	    }
	    50% {
		    transform: translateY(100%);
	    }
    }
</style>