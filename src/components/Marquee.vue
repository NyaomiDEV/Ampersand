<template>
	<div class="marquee-container">
		<span class="marquee">
			<slot />
		</span>
	</div>
</template>

<style scoped>

	.marquee-container {
		display: block;
		overflow: hidden;
		white-space: nowrap;
        width: 100%;
	}
		
    .marquee {
        display: block;
		animation-iteration-count: infinite;
		animation-timing-function: linear;
	}

    .marquee-container.left .marquee {
        animation-name: marquee-to-left;
        animation-duration: 12s;
    }

    .marquee-container.right .marquee {
        animation-name: marquee-to-right;
        animation-duration: 12s;
    }

    .marquee-container.top .marquee {
        animation-name: marquee-to-top;
        animation-duration: 2s;
    }

    .marquee-container.bottom .marquee {
        animation-name: marquee-to-bottom;
        animation-duration: 2s;
    }

    @keyframes marquee-to-left {
	    from {
		    transform: translateX( 100% );
	    }
	    to {
		    transform: translateX( -100% );
	    }
    }

    @keyframes marquee-to-right {
	    from {
		    transform: translateX( -100% );
	    }
	    to {
		    transform: translateX( 100% );
	    }
    }

    @keyframes marquee-to-top {
	    from {
		    transform: translateY( 100% );
	    }
	    to {
		    transform: translateY( -100% );
	    }
    }

    @keyframes marquee-to-bottom {
	    from {
		    transform: translateY( -100% );
	    }
	    to {
		    transform: translateY( 100% );
	    }
    }
</style>