<script setup lang="ts">
	import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonBackButton } from "@ionic/vue";
	
	import AmpersandLogo from "../../assets/ampersand_logo.svg";
	import CodebergLogo from "../../assets/codeberg_logo.svg";
	import LiberapayLogo from "../../assets/liberapay_logo.svg";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import globeMD from "@material-symbols/svg-600/outlined/globe.svg";

	import { version } from "../../../package.json";
	import { openUrl } from "@tauri-apps/plugin-opener";
	import { ref } from "vue";

	const egg = ref(0);

	async function openRepo(){
		const url = "https://codeberg.org/Ampersand/app";
		await openUrl(url);
	}

	async function openWebsite(){
		const url = "https://ampersand.moe/";
		await openUrl(url);
	}

	async function openPrivacyPolicy(){
		const url = "https://codeberg.org/Ampersand/app/wiki/Privacy-Policy";
		await openUrl(url);
	}

	async function openLiberapay(){
		const url = "https://liberapay.com/Ampersand/";
		await openUrl(url);
	}

	function accumulateEgg(){
		if(egg.value < 10){
			++egg.value;
			if(egg.value === 10)
				document.getElementsByClassName("logo")[0].classList.add("egg-on");
		}else
			return;
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
					{{ $t("about:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<div class="container">
				<div class="headings">
					<h1>Ampersand</h1>
					<span>{{ $t("about:version", { version }) }}</span>
					<span>{{ $t("about:madein") }}</span>
				</div>

				<div class="logo" @click="accumulateEgg">
					<IonIcon :icon="AmpersandLogo" />
					<img src="../../assets/mia.webp" />
				</div>

				<div class="buttons">
					<IonButton class="tonal" shape="round" @click="openRepo">
						<IonIcon slot="icon-only" :icon="CodebergLogo" />
					</IonButton>

					<IonButton class="tonal" shape="round" @click="openWebsite">
						<IonIcon slot="icon-only" :icon="globeMD" />
					</IonButton>

					<IonButton class="tonal" shape="round" @click="openLiberapay">
						<IonIcon slot="icon-only" :icon="LiberapayLogo" />
					</IonButton>
				</div>

				<IonButton fill="outline" @click="openPrivacyPolicy">
					{{ $t("about:privacyPolicy") }}
				</IonButton>
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
		text-align: center;
		gap: 1.5em;
	}

	.headings {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.logo {
		position: relative;
		width: 256px;
		height: 256px;
		color: var(--ion-color-primary);
	}

	.logo > * {
		animation-timing-function: ease-in-out;
		animation-duration: 0.5s;
		animation-fill-mode: forwards;
		transform: none;
		position: absolute;
		top: 0;
		left: 0;
	}

	.logo > ion-icon {
		width: 100%;
		height: 100%;
	}

	.logo > img {
		transform: rotateY(0.25turn);
	}

	.buttons {
		display: flex;
		gap: 16px;
	}

	.logo.egg-on > ion-icon {
		animation-name: logo;
	}

	.logo.egg-on > img {
		animation-name: mia;
	}

	@keyframes logo {
		0% {
			transform: none;
		}
		50% {
			transform: rotateY(0.25turn);
		}
		100% {
			transform: rotateY(0.25turn);
		}
	}

	@keyframes mia {
		0% {
			transform: rotateY(0.75turn);
		}
		50% {
			transform: rotateY(0.75turn);
		}
		100% {
			transform: rotateY(1turn);
		}
	}
</style>