<script setup lang="ts">
	import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonBackButton } from "@ionic/vue";
	
	import AmpersandLogo from "../../assets/ampersand_logo.svg";
	import CodebergLogo from "../../assets/codeberg_logo.svg";
	import LiberapayLogo from "../../assets/liberapay_logo.svg";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import globeMD from "@material-symbols/svg-600/outlined/globe.svg";

	import { version } from "../../../package.json";
	import { openUrl } from "@tauri-apps/plugin-opener";

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

				<IonIcon class="logo" :icon="AmpersandLogo" />

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

				<IonButton fill="clear" @click="openPrivacyPolicy">
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
		width: 256px;
		height: 256px;
		color: var(--ion-color-primary);
	}

	.buttons {
		display: flex;
		gap: 16px;
	}
</style>