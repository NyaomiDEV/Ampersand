<script setup lang="ts">
	import { IonContent, IonHeader, IonLabel, IonItem, IonList, IonPage, IonTitle, IonToolbar, IonToggle, IonBackButton, IonIcon, alertController } from "@ionic/vue";
	import { ref, onMounted } from "vue";
	import { disableApplock, enableApplock, areBiometricsAvailable } from "../../lib/applock";
	import { securityConfig } from "../../lib/config";
	import { useTranslation } from "i18next-vue";

	import lockMD from "@material-symbols/svg-600/outlined/lock.svg";
	import passwordMD from "@material-symbols/svg-600/outlined/password_2.svg";
	import biometricsMD from "@material-symbols/svg-600/outlined/fingerprint.svg";
	import remoteMD from "@material-symbols/svg-600/outlined/network_manage.svg";
	import { promptOkCancel } from "../../lib/util/misc";

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
							role: "outline",
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
		if(!await promptOkCancel(
			i18next.t("security:passwordAlert.header"),
			undefined,
			i18next.t("security:passwordAlert.text")
		)){
			usePassword.value = false;
			return;
		}

		const password = await enterPasswordAlert(i18next.t("security:inputPassword.titleAdd"));
		if(!password){
			usePassword.value = false;
			return;
		}

		const passwordAgain = await enterPasswordAlert(i18next.t("security:inputPassword.titleReenter"));
		if(password !== passwordAgain){
			usePassword.value = false;
			return;
		}

		const result = enableApplock(password);
		usePassword.value = result;
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
					<IonIcon slot="start" :icon="lockMD" />
					<IonToggle v-model="usePassword" @ion-change="toggle">
						<IonLabel>
							<h3>{{ $t("security:applock.title") }}</h3>
							<p>{{ $t("security:applock.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem
					v-if="securityConfig.password"
					button
					:detail="true"
					@click="modifyPassword"
				>
					<IonIcon slot="start" :icon="passwordMD" />
					<IonLabel>
						<h3>{{ $t("security:editPassword") }}</h3>
					</IonLabel>
				</IonItem>

				<IonItem v-if="biometricsAvailable && securityConfig.password">
					<IonIcon slot="start" :icon="biometricsMD" />
					<IonToggle v-model="securityConfig.useBiometrics">
						<IonLabel>
							<h3>{{ $t("security:biometrics.title") }}</h3>
							<p>{{ $t("security:biometrics.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonIcon slot="start" :icon="remoteMD" />
					<IonToggle v-model="securityConfig.allowRemoteContent">
						<IonLabel>
							<h3>{{ $t("security:allowRemoteContent.title") }}</h3>
							<p>{{ $t("security:allowRemoteContent.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

			</IonList>
		</IonContent>
	</IonPage>
</template>
