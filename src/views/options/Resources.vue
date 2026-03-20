<script setup lang="ts">
	import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonBackButton, IonListHeader, IonLabel, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonList } from "@ionic/vue";
	import { openUrl } from "@tauri-apps/plugin-opener";

	import forwardMD from "@material-symbols/svg-600/outlined/arrow_forward.svg";

	import globeMD from "@material-symbols/svg-600/outlined/globe.svg";
	import wikiMD from "@material-symbols/svg-600/outlined/book_2.svg";
	import CodebergLogo from "../../assets/codeberg_logo.svg";
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
					{{ $t("resources:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonListHeader>
				<IonLabel>{{ $t("resources:ampersand") }}</IonLabel>
			</IonListHeader>

			<IonList>
				<IonCard button @click="openUrl('https://ampersand.moe')">
					<IonCardHeader>
						<IonCardTitle>
							<IonIcon :icon="globeMD" />
							{{ $t("resources:website.title") }}
						</IonCardTitle>
						<IonIcon :icon="forwardMD" flip-rtl />
					</IonCardHeader>
					<IonCardContent>
						{{ $t("resources:website.desc") }}
					</IonCardContent>
				</IonCard>
				<IonCard button @click="openUrl('https://codeberg.org/Ampersand/app/wiki')">
					<IonCardHeader>
						<IonCardTitle>
							<IonIcon :icon="wikiMD" />
							{{ $t("resources:wiki.title") }}
						</IonCardTitle>
						<IonIcon :icon="forwardMD" flip-rtl />
					</IonCardHeader>
					<IonCardContent>
						{{ $t("resources:wiki.desc") }}
					</IonCardContent>
				</IonCard>
				<IonCard button @click="openUrl('https://codeberg.org/Ampersand/app')">
					<IonCardHeader>
						<IonCardTitle>
							<IonIcon :icon="CodebergLogo" />
							{{ $t("resources:repository.title") }}
						</IonCardTitle>
						<IonIcon :icon="forwardMD" flip-rtl />
					</IonCardHeader>
					<IonCardContent>
						{{ $t("resources:repository.desc") }}
					</IonCardContent>
				</IonCard>
			</IonList>
		</IonContent>
	</IonPage>
</template>

<style>
	ion-list-header {
		text-align: center;
		font-size: 1.25em;
		color: var(--ion-text-color);
	}

	ion-card-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	ion-card-title > ion-icon {
		margin-inline-end: 8px;
		width: 1.25em;
		height: 1.25em;
		vertical-align: text-bottom;
	}

	ion-card-header > ion-icon {
		width: 20px;
		height: 20px;
	}
</style>