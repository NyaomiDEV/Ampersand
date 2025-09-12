<script setup lang="ts">
	import { onMounted } from "vue";
	import { IonPage, IonContent, IonLabel, IonInput, useIonRouter } from "@ionic/vue";
	import { unlockWithPassword, unlockWithBiometrics } from "../lib/applock";
	import { securityConfig } from "../lib/config";
	import { useRoute } from "vue-router";
	
	const router = useIonRouter();
	const route = useRoute();

	onMounted(async () => {
		if(securityConfig.useBiometrics && await unlockWithBiometrics()) 
			router.replace(route.query.wantedPath || "/");
		
	});

	function checkAndTryUnlocking(input: string){
		if(unlockWithPassword(input))
			router.replace(route.query.wantedPath || "/");
		
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
					label-placement="floating"
					:label="$t('lock:hint')"
					@update:model-value="checkAndTryUnlocking"
				/>
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