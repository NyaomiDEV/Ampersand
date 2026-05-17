<script setup lang="ts">
	import {
		IonModal
	} from "@ionic/vue";
	import Spinner from "../components/Spinner.vue";
</script>

<template>
	<IonModal class="loading-modal" :backdrop-dismiss="false" show-backdrop>
		<Spinner size="96px" />
	</IonModal>
</template>

<style scoped>
	.loading-modal {
		--border-radius: 16px;
		--height: fit-content;
		--width: fit-content;
	}

	.loading-modal::part(content) {
		padding: 16px;
		box-sizing: border-box;
	}
</style>
