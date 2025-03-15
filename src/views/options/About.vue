<script setup lang="ts">
	import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonBackButton } from '@ionic/vue';
	import { inject } from 'vue';

	import AmpersandLogo from "../../assets/ampersand_logo.svg"
	import CodebergLogo from "../../assets/codeberg_logo.svg";
	import GithubLogo from "../../assets/github_logo.svg";
	import LiberapayLogo from "../../assets/liberapay_logo.svg";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";

	import { version } from "../../../package.json";
	import { openUrl } from '@tauri-apps/plugin-opener';

	const isIOS = inject<boolean>("isIOS");

	function isAppStore() {
		try{
			return !!import.meta.env.AMPERSAND_IS_APP_STORE;
		}catch(e){
		 	return false;
		}
	}

	function openRepo(){
		const url = "https://codeberg.org/NyaomiDEV/Ampersand";
		if(!('isTauri' in window)){
			open(url, "_blank");
		} else {
			openUrl(url);
		}
	}

	function openDiscord() {
		const url = "https://discord.com/invite/xCptGJKeKc";
		if(!('isTauri' in window)){
			open(url, "_blank");
		} else {
			openUrl(url);
		}
	}

	function openLiberapay(){
		const url = "https://liberapay.com/Ampersand/";
		if(!('isTauri' in window)){
			open(url, "_blank");
		} else {
			openUrl(url);
		}
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" :text="isIOS ? $t('other:back') : undefined" :icon="!isIOS ? backMD : undefined" defaultHref="/options/" />
				<IonTitle>
					{{ $t("about:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<div class="container">
				<h1>Ampersand</h1>
				<p>{{ $t("about:version", { version }) }}</p>
				<p>{{ $t("about:madein") }}</p>

				<IonIcon class="logo" :icon="AmpersandLogo" />

				<div class="buttons">
					<IonButton class="tonal" shape="round" @click="openDiscord">
						<IonIcon slot="icon-only" :icon="CodebergLogo"></IonIcon>
					</IonButton>

					<IonButton class="tonal" shape="round" @click="openRepo">
						<IonIcon slot="icon-only" :icon="GithubLogo" ></IonIcon>
					</IonButton>

					<IonButton class="tonal" shape="round" @click="openLiberapay" v-if="!isAppStore()">
						<IonIcon slot="icon-only" :icon="LiberapayLogo" ></IonIcon>
					</IonButton>
				</div>
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
	}

	p {
		margin: 0;
	}

	.logo {
		margin: 32px 0;
		width: 256px;
		height: 256px;
		color: var(--ion-color-primary);
	}

	.buttons {
		display: flex;
		gap: 16px;
	}
</style>