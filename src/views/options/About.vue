<script setup lang="ts">
	import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonBackButton, IonList, IonItem, IonToggle, IonLabel } from "@ionic/vue";
	import { appConfig } from "../../lib/config";
	
	import AmpersandLogo from "../../assets/ampersand_logo.svg";

	import { version } from "../../../package.json";
	import { openUrl } from "@tauri-apps/plugin-opener";
	import { computed, onMounted, ref } from "vue";

	import { checkUpdates, checkIsUpdateNewer } from "../../lib/update";
	import { UpdateCheckResponse } from "../../lib/types";
	import Markdown from "../../components/Markdown.vue";

	import credits from "../../assets/credits.md";

	const egg = ref(0);
	const showDeveloperToggle = computed(() => egg.value >= 10);
	const newVersion = ref<UpdateCheckResponse>();
	const isCiVersion = import.meta.env.AMPERSAND_IS_CI_BUILD === "1";

	async function openPrivacyPolicy(){
		const url = "https://codeberg.org/Ampersand/app/wiki/Privacy-Policy";
		await openUrl(url);
	}

	async function openUpdate(){
		if(newVersion.value)
			await openUrl(newVersion.value.url);
	}

	function accumulateEgg(){
		if(egg.value < 10){
			++egg.value;
			if(egg.value === 10)
				document.getElementsByClassName("logo")[0].classList.add("egg-on");
		}else
			return;
	}

	onMounted(async () => {
		const response = await checkUpdates();
		if(response && checkIsUpdateNewer(response))
			newVersion.value = response;
	});
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
					{{ $t("about:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<div class="container">
				<div class="headings">
					<h3>Ampersand</h3>
					<span>{{ $t("about:version", { version }) }}{{ isCiVersion ? ` - ${$t("about:ciVersion")}` : "" }}</span>
					<span>{{ $t("about:madein") }}</span>
				</div>

				<IonButton v-if="newVersion" @click="openUpdate">
					{{ $t("about:updateAvailable", { newVersion: newVersion.version }) }}
				</IonButton>

				<div class="logo" @click="accumulateEgg">
					<IonIcon :icon="AmpersandLogo" />
					<img src="../../assets/mia.webp" />
				</div>

				<IonButton fill="outline" @click="openPrivacyPolicy">
					{{ $t("about:privacyPolicy") }}
				</IonButton>
			</div>

			<IonList v-if="showDeveloperToggle">
				<IonItem button>
					<IonToggle v-model="appConfig.isDeveloperMode">
						<IonLabel>{{ $t("other:developerMode") }}</IonLabel>
					</IonToggle>
				</IonItem>
			</IonList>

			<div class="credits">
				<h3>{{ $t("about:credits") }}</h3>
				<Markdown :markdown="credits" />
			</div>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	.container {
		display: flex;
		width: 100%;
		min-height: calc(100% - 48px - 2.25em);
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
		pointer-events: none;
	}

	.logo > ion-icon {
		width: 100%;
		height: 100%;
	}

	.logo > img {
		transform: rotateY(0.25turn);
	}

	.logo.egg-on > ion-icon {
		animation-name: logo;
	}

	.logo.egg-on > img {
		animation-name: mia;
	}

	.credits {
		margin: 16px;
		border-radius: 16px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		background-color: rgb(var(--md3-surface-container));
		color: rgb(var(--md3-on-surface-container));

		h3 {
			text-align: center;
			margin: 0;
			line-height: normal;
		}
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