<script setup lang="ts">
    import { IonContent, IonPage, IonButton } from '@ionic/vue';
	import { ref } from 'vue';
	import Spinner from '../../components/Spinner.vue';

	const loading = ref(false);
</script>

<template>
    <IonPage>
        <IonContent>
				<div class="container" v-if="!loading">
					<h1>{{ $t("onboarding:importScreen.header") }}</h1>

					<IonButton @click="loading = true">
						{{ $t("onboarding:importScreen.prevInstall") }}
					</IonButton>

					<IonButton routerLink="/onboarding/system">
						{{ $t("onboarding:importScreen.startFromScratch") }}
					</IonButton>
				</div>

				<div class="container" v-else>
					<h1>{{ $t("onboarding:importScreen.pleaseWait") }}</h1>
					<Spinner />
				</div>
        </IonContent>
    </IonPage>
</template>

<style scoped>
	.container {
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