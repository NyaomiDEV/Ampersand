<script setup lang="ts">
	import { IonContent, IonPage, IonButton, IonIcon, useIonRouter } from "@ionic/vue";

	import ArrowMD from "@material-symbols/svg-600/rounded/arrow_forward.svg";

	const router = useIonRouter();
</script>

<template>
	<IonPage>
		<IonContent>
			<div class="container">
				<h1>{{ $t("onboarding:endScreen.header") }}</h1>

				<IonButton @click="router.replace('/')">
					{{ $t("onboarding:endScreen.startButton") }}
					<IonIcon slot="end" :icon="ArrowMD" />
				</IonButton>
			</div>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	.container {
		display: flex;
		width: 100%;
		min-height: 100%;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		text-align: center;
		padding: 1em;

		h1 {
			font-size: 2.25em;
		}
	}
</style>