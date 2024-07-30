<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonImg, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonBackButton} from '@ionic/vue';
	import { inject } from 'vue';

	import {
		sparklesOutline as SparklesIOS,
	} 
	from "ionicons/icons";
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

					<IonIcon class="logo"
					src="../assets/ampersand_logo.svg" />

					<br />
					<br />

					<IonButton shape="round" href="https://discord.com/invite/xCptGJKeKc">
						<IonIcon slot="icon-only" src="../assets/discord_logo.svg"></IonIcon>
					</IonButton>

					<IonButton shape="round" href="https://github.com/NyaomiDEV/Ampersand">
						<IonIcon slot="icon-only" src="../assets/github_logo.svg"></IonIcon>
					</IonButton>
				</div>
			</IonList>
		</IonContent>
	</IonPage>
</template>
