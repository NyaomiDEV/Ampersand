<script setup lang="ts">
	import { IonContent, IonPage, IonButton, IonIcon, useIonRouter } from '@ionic/vue';
	import {arrowForwardOutline as ArrowIOS} from "ionicons/icons";
	import ArrowMD from "@material-symbols/svg-600/outlined/arrow_forward.svg";

	const router = useIonRouter();
</script>

<template>
	<IonPage>
		<IonContent>
			<div class="container">
				<h1>{{ $t("onboarding:endScreen.header") }}</h1>

				<IonButton @click="router.push('/')">
					{{ $t("onboarding:endScreen.startButton") }}
					<IonIcon slot="end" :ios="ArrowIOS" :md="ArrowMD"></IonIcon>
				</IonButton>
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
	}
</style>