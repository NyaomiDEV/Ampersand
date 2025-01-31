<script setup lang="ts">
    import { IonContent, IonPage, IonButton, IonIcon } from '@ionic/vue';
    import {accessibilityOutline as AccessibilityIOS} from "ionicons/icons";
    import AccessibilityMD from "@material-symbols/svg-600/outlined/accessibility_new.svg";
    import AmpersandLogo from  "../../assets/ampersand_logo.svg"

</script>

<template>
    <IonPage>
        <IonContent>
            <div class="container">
                <h1>{{ $t("onboarding:welcomeScreen.header") }}</h1>
                <IonIcon class="logo" :icon="AmpersandLogo" />

                <IonButton routerLink="/onboarding/import">
                    {{ $t("onboarding:welcomeScreen.start") }}
                </IonButton>

                <div class="button">
					<IonButton class="tonal" shape="round" routerLink="/options/accessibility">
						<IonIcon slot="icon-only" :md="AccessibilityMD" :ios="AccessibilityIOS"></IonIcon>
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
		height: 100%;
		align-items: center;
		justify-content: center;
		flex-direction: column;
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