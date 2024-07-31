<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonImg, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonBackButton} from '@ionic/vue';
	import { inject } from 'vue';

	import AmpersandLogo from  "../../../assets/ampersand_logo.svg"
	import DiscordLogo from  "../../../assets/discord_logo.svg";
	import GithubLogo from  "../../../assets/github_logo.svg";
	const isIOS = inject<boolean>("isIOS");
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
			<IonList :inset="isIOS">				
				<div class="centered-text">
					<h1>Ampersand</h1>
					<p> {{ $t("options:about.version") }} 0.0.0 </p>
					<p> {{ $t("options:about.madein") }}</p>

					<IonIcon class="logo" :icon="AmpersandLogo"/>

					<br />
					<br />

					<IonButton shape="round" href="https://discord.com/invite/xCptGJKeKc">
						<IonIcon slot="icon-only" :icon="DiscordLogo" />
					</IonButton>

					<IonButton shape="round" href="https://github.com/NyaomiDEV/Ampersand">
						<IonIcon slot="icon-only" :icon="GithubLogo" />
					</IonButton>
				</div>
			</IonList>
		</IonContent>
	</IonPage>
</template>
