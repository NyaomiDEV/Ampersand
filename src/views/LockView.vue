<script setup lang="ts">
	import { IonPage, IonContent, IonLabel, IonInput } from "@ionic/vue";
	import { unlock } from "../lib/applock";

	function checkAndTryUnlocking(e){
		console.log(unlock(e.detail.value));
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