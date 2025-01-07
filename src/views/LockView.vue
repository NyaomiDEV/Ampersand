<script setup lang="ts">
	import { onMounted, onUnmounted, watch } from "vue";
	import { IonPage, IonContent, IonLabel, IonInput, useIonRouter } from "@ionic/vue";
	import { unlockWithPassword, areBiometricsAvailable, unlockWithBiometrics, isLocked } from "../lib/applock";
	import { securityConfig } from "../lib/config";
	
	const router = useIonRouter();

	const handle = watch(isLocked, () => {
		if(!isLocked.value)
			router.replace("/")
	});

	onMounted(async () => {
		if(securityConfig.useBiometrics && await areBiometricsAvailable())
			await unlockWithBiometrics();
	});

	onUnmounted(() => {
		if(handle) handle();
	});

	function checkAndTryUnlocking(e){
		unlockWithPassword(e.detail.value);
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