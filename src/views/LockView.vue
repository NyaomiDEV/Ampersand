<script setup lang="ts">
	import { onMounted } from "vue";
	import { IonPage, IonContent, IonLabel, IonInput, useIonRouter, IonList, IonItem, IonIcon } from "@ionic/vue";
	import { unlockWithPassword, unlockWithBiometrics } from "../lib/applock";
	import { securityConfig } from "../lib/config";
	import { useRoute } from "vue-router";

	import LockMD from "@material-symbols/svg-600/outlined/lock.svg";
	
	const router = useIonRouter();
	const route = useRoute();

	onMounted(() => {
		setTimeout(tryBiometrics, 100);
	});

	async function tryBiometrics(){
		if(securityConfig.useBiometrics && await unlockWithBiometrics()) 
			router.replace(route.query.wantedPath || "/");
	}

	function checkAndTryUnlocking(evt){
		if(unlockWithPassword(evt.detail.value))
			router.replace(route.query.wantedPath || "/");
	}
</script>

<template>
	<IonPage>
		<IonContent>

			<div>
				<IonIcon :icon="LockMD" />
				<IonLabel>
					<h1>{{ $t("lock:title") }}</h1>
				</IonLabel>
				<IonList>
					<IonItem>
						<IonInput
							type="password"
							label-placement="floating"
							:label="$t('lock:hint')"
							@ion-change="checkAndTryUnlocking"
						/>
					</IonItem>
				</IonList>

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

	ion-icon {
		width: 48px;
		height: 48px;
		color: var(--ion-color-primary);
	}

	ion-list {
		width: 50vw;
	}
</style>