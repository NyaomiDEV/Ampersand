<script setup lang="ts">
	import { IonContent, IonPage, IonButton, IonIcon, useIonRouter } from "@ionic/vue";
	import LanguageMD from "@material-symbols/svg-600/outlined/language.svg";
	import AccessibilityMD from "@material-symbols/svg-600/outlined/accessibility_new.svg";
	import AmpersandLogo from "../../assets/ampersand_logo.svg";
	import { slideAnimation, languagePicker } from "../../lib/util/misc";
	import { appConfig } from "../../lib/config";

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
					<IonButton
						class="tonal"
						size="small"
						shape="round"
						router-link="/options/accessibility/"
					>
						<IonIcon slot="icon-only" :icon="AccessibilityMD" />
					</IonButton>

					<IonButton class="tonal" size="small" @click="languagePicker().then(res => { if(res) appConfig.locale.language = res; })">
						<IonIcon slot="start" :icon="LanguageMD" />
						{{ $t("other:languageName.local") }}
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

	div.button {
		margin: 12 auto;
		display: flex;
		gap: 16px;
	}
</style>