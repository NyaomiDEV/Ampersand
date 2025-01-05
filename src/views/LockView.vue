<script setup lang="ts">
	import { onMounted } from "vue";
	import { IonPage, IonContent, IonLabel, IonInput, useIonRouter } from "@ionic/vue";
	import { unlock, areBiometricsAvailable, unlockWithBiometrics } from "../lib/applock";
	import { securityConfig } from "../lib/config";
	
	const router = useIonRouter();

	onMounted(async () => {
		if(securityConfig.useBiometrics && await areBiometricsAvailable() && await unlockWithBiometrics())
			router.replace("/");
	});

	function checkAndTryUnlocking(e){
		if(unlock(e.detail.value))
			router.replace("/");
	}
</script>

<template>
	<IonPage>
		<IonContent>

			<div>
				<IonLabel>
					<h1>{{ $t("lock:title") }}</h1>
				</IonLabel>
				<IonInput
					fill="outline"
					type="password"
					labelPlacement="floating"
					:label="$t('lock:hint')"
					@ionInput="checkAndTryUnlocking"
				></IonInput>
			</div>

		</IonContent>
	</IonPage>
</template>

<style scoped>
	div {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
		height: 100%;
		justify-content: center;
		align-items: center;
		text-align: center;
		padding: 24px;
	}
</style>