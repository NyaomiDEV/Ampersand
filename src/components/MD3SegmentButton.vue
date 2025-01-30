<script setup lang="ts">
	import { IonSegmentButton, IonIcon } from "@ionic/vue";

	import CheckMD from '@material-symbols/svg-600/outlined/check.svg';
</script>

<template>
	<IonSegmentButton layout="icon-start">
		<IonIcon :md="CheckMD" aria-hidden="true"/>
		<slot></slot>
	</IonSegmentButton>
</template>

<style scoped>
	ion-icon {
		display: none;
	}

	ion-segment-button.md.segment-button-checked ion-icon {
		display: inline;
	}
</style>