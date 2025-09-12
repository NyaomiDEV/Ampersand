<script setup lang="ts">
	import { IonContent, IonPage, IonButton, IonIcon, useIonRouter } from "@ionic/vue";
	import AccessibilityMD from "@material-symbols/svg-600/outlined/accessibility_new.svg";
	import AmpersandLogo from "../../assets/ampersand_logo.svg";
	import { slideAnimation } from "../../lib/util/misc";

	const router = useIonRouter();
</script>

<template>
	<IonPage>
		<IonContent>
			<div class="container">
				<h1>{{ $t("onboarding:welcomeScreen.header") }}</h1>
				<IonIcon class="logo" :icon="AmpersandLogo" />

				<IonButton @click="router.replace('/onboarding/import/', slideAnimation)">
					{{ $t("onboarding:welcomeScreen.start") }}
				</IonButton>

				<div class="button">
					<IonButton class="tonal" shape="round" router-link="/options/accessibility/">
						<IonIcon slot="icon-only" :icon="AccessibilityMD" />
					</IonButton>
				</div>
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
		padding: 1em;
	}

	.container h1 {
		text-align: center;
	}
	
	.logo {
		margin: 14px 0 12px 0;
		width: 256px;
		height: 256px;
		color: var(--ion-color-primary);
	}

	.button {
		margin: 12 auto;
	}
</style>