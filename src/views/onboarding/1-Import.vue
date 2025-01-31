<script setup lang="ts">
    import { IonContent, IonPage, IonButton, useIonRouter } from '@ionic/vue';
	import { ref } from 'vue';
	import Spinner from '../../components/Spinner.vue';

	const loading = ref(false);

	const router = useIonRouter();
</script>

<template>
	<IonPage>
		<IonContent>
			<div class="import-container" v-if="!loading">
				<h1>{{ $t("onboarding:importScreen.header") }}</h1>

				<IonButton @click="loading = true">
					{{ $t("onboarding:importScreen.prevInstall") }}
				</IonButton>

				<IonButton @click="router.replace('/onboarding/system/')">
					{{ $t("onboarding:importScreen.startFromScratch") }}
				</IonButton>
			</div>

			<div class="import-loading-container" v-else>
				<h1>{{ $t("onboarding:importScreen.pleaseWait") }}</h1>
				<Spinner />
			</div>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	.import-container, .import-loading-container {
		position: absolute;
		display: flex;
		width: 100%;
		height: 100%;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		text-align: center;
		gap: 16px;
	}
</style>