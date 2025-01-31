<script setup lang="ts">
	import { onMounted, onUnmounted, watch } from "vue";
	import { IonPage, IonContent, IonLabel, IonInput, useIonRouter } from "@ionic/vue";
	import { unlockWithPassword, unlockWithBiometrics, isLocked } from "../lib/applock";
	import { securityConfig } from "../lib/config";
	import { useRoute } from "vue-router";
	
	const router = useIonRouter();
	const route = useRoute();

	const handle = watch(isLocked, () => {
		if(!isLocked.value)
			router.replace(route.query.wantedPath || "/")
	});

	onMounted(async () => {
		if(securityConfig.useBiometrics)
			await unlockWithBiometrics();
	});

	onUnmounted(() => {
		if(handle) handle();
	});

	function checkAndTryUnlocking(input: string){
		unlockWithPassword(input);
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
					@update:modelValue="checkAndTryUnlocking"
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