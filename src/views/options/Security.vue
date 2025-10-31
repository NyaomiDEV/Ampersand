<script setup lang="ts">
	import { IonContent, IonHeader, IonLabel, IonItem, IonList, IonPage, IonTitle, IonToolbar, IonToggle, IonBackButton, alertController } from "@ionic/vue";
	import { ref, onMounted } from "vue";
	import { disableApplock, enableApplock, areBiometricsAvailable } from "../../lib/applock";
	import { securityConfig } from "../../lib/config";
	import { useTranslation } from "i18next-vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";

	const i18next = useTranslation();

	const usePassword = ref(securityConfig.usePassword);
	const biometricsAvailable = ref(false);

	onMounted(async () => {
		biometricsAvailable.value = await areBiometricsAvailable();
	});

	function enterPasswordAlert(prompt: string): Promise<string | null>{
		return new Promise((resolve) => {
			void (async () => {
				const alert = await alertController.create({
					header: prompt,
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
							placeholder: i18next.t("security:inputPassword.hint")
						}
					]
				});

				await alert.present();
			})();
		});
	}

	async function addPassword() {
		const password = await enterPasswordAlert(i18next.t("security:inputPassword.titleAdd"));
		const passwordAgain = await enterPasswordAlert(i18next.t("security:inputPassword.titleReenter"));

		if(password && password === passwordAgain){
			const result = enableApplock(password);
			usePassword.value = result;
		} else 
			usePassword.value = false;
	}

	async function modifyPassword() {
		const passwordOld = await enterPasswordAlert(i18next.t("security:inputPassword.titleModifyOld"));
		if(!passwordOld) return;
		const password = await enterPasswordAlert(i18next.t("security:inputPassword.titleModifyNew"));
		if(!password) return;
		const passwordAgain = await enterPasswordAlert(i18next.t("security:inputPassword.titleReenter"));
		if(!passwordAgain) return;

		if(password === passwordAgain && disableApplock(passwordOld)){
			const result = enableApplock(password);
			usePassword.value = result;
		}
	}

	async function disablePassword() {
		const password = await enterPasswordAlert(i18next.t("security:inputPassword.titleDisable"));

		if(password){
			const result = disableApplock(password);
			usePassword.value = !result;
		}
		else
			usePassword.value = true;
	}

	function toggle(){
		if(usePassword.value) 
			return addPassword();
		

		return disablePassword();		
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					:icon="backMD"
					default-href="/options/"
				/>
				<IonTitle>
					{{ $t("security:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList>
				<IonItem>
					<IonToggle v-model="usePassword" @ion-change="toggle">
						<IonLabel>
							<h3>{{ $t("security:applock.title") }}</h3>
							<p>{{ $t("security:applock.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem
					button
					:detail="true"
					:disabled="!securityConfig.password"
					@click="modifyPassword"
				>
					<IonLabel>
						<h3>{{ $t("security:editPassword") }}</h3>
					</IonLabel>
				</IonItem>

				<IonItem v-if="biometricsAvailable" :disabled="!securityConfig.password">
					<IonToggle v-model="securityConfig.useBiometrics">
						<IonLabel>
							<h3>{{ $t("security:biometrics.title") }}</h3>
							<p>{{ $t("security:biometrics.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

			</IonList>
		</IonContent>
	</IonPage>
</template>
