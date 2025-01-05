<script setup lang="ts">
	import { IonContent, IonHeader, IonLabel, IonItem, IonList, IonPage, IonTitle, IonToolbar, IonToggle, IonBackButton, alertController } from '@ionic/vue';
	import { inject, ref, onMounted } from 'vue';
	import { disableApplock, enableApplock, areBiometricsAvailable } from '../../lib/applock';
	import { securityConfig } from '../../lib/config';
	import { useTranslation } from 'i18next-vue';

	const isIOS = inject<boolean>("isIOS");
	const i18next = useTranslation();

	const usePassword = ref(securityConfig.usePassword);
	const biometricsAvailable = ref(false);

	onMounted(async () => {
		biometricsAvailable.value = await areBiometricsAvailable();
	});

	function enterPasswordAlert(): Promise<string | null>{
		return new Promise(async (resolve) => {
			const alert = await alertController.create({
				header: i18next.t("options:security.inputPassword.title"),
				buttons: [
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel",
						handler: () => resolve(null)
					},
					{
						text: i18next.t("other:alerts.ok"),
						role: "confirm",
						handler: (e) => resolve(e.password)
					}
				],
				inputs: [
					{
						name: "password",
						type: "password",
						placeholder: i18next.t("options:security.inputPassword.hint")
					}
				]
			});

			await alert.present();
		});
	}

	async function modifyPassword() {
		const password = await enterPasswordAlert();

		if(password){
			const result = enableApplock(password);
			usePassword.value = result;
		} else
			usePassword.value = false;
	}

	async function disablePassword() {
		const password = await enterPasswordAlert();

		if(password){
			const result = disableApplock(password);
			usePassword.value = !result;
		}
		else
			usePassword.value = true;
	}

	function toggle(){
		if(usePassword.value) {
			return modifyPassword();
		}

		return disablePassword();		
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:security.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList :inset="isIOS">
				<IonItem>
					<IonToggle @ionChange="toggle" v-model="usePassword">
						<IonLabel>
							<h3>{{ $t("options:security.applock.title") }}</h3>
							<p>{{ $t("options:security.applock.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem button :detail="true" @click="modifyPassword" :disabled="!securityConfig.password">
					<IonLabel>
						<h3>{{ $t("options:security.editPassword") }}</h3>
					</IonLabel>
				</IonItem>

				<IonItem v-if="biometricsAvailable" :disabled="!securityConfig.password">
					<IonToggle v-model="securityConfig.useBiometrics">
						<IonLabel>
							<h3>{{ $t("options:security.biometrics.title") }}</h3>
							<p>{{ $t("options:security.biometrics.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

			</IonList>
		</IonContent>
	</IonPage>
</template>
