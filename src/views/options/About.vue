<script setup lang="ts">
	import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonBackButton } from '@ionic/vue';

	import AmpersandLogo from  "../../assets/ampersand_logo.svg"
	import DiscordLogo from  "../../assets/discord_logo.svg";
	import GithubLogo from  "../../assets/github_logo.svg";
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:about.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<div class="container">
				<h1>Ampersand</h1>
				<p> {{ $t("options:about.version") }} 0.0.0 </p>
				<p> {{ $t("options:about.madein") }}</p>

				<IonIcon class="logo" :icon="AmpersandLogo" />

				<div class="buttons">
					<IonButton shape="round" href="https://discord.com/invite/xCptGJKeKc">
						<IonIcon slot="icon-only" :icon="DiscordLogo"></IonIcon>
					</IonButton>

					<IonButton shape="round" href="https://github.com/NyaomiDEV/Ampersand">
						<IonIcon slot="icon-only" :icon="GithubLogo" ></IonIcon>
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
	}

	.buttons {
		display: flex;
		gap: 16px;
	}
</style>