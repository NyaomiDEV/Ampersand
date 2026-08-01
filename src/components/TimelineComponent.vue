<script setup lang="ts">
	import { IonItem } from "@ionic/vue";

</script>

<template>
	<IonItem>
		<div slot="start" class="timeline-thingy" />
		<slot />
	</IonItem>
</template>

<style scoped>
	div.timeline-thingy {
		position: relative;
		width: 16px;
		min-height: 16px;
		align-self: stretch;
	}

	div.timeline-thingy::before {
		content: "\A";
		border-radius: 100%;
		background-color: var(--ion-color-primary);
		position: absolute;
		top: 12px;
		left: 0;
		width: 16px;
		height: 16px;
	}

	div.timeline-thingy::after {
		content: "\A";
		background-color: var(--ion-color-primary);
		position: absolute;
		top: 0px;
		left: 7px;
		width: 2px;
		height: 100%;
	}

	ion-item:first-child .timeline-thingy::after {
		top: 20px;
	}

	ion-item:last-child div.timeline-thingy::after {
		height: 20px;
	}
</style>