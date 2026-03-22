<script setup lang="ts">
	import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonBackButton, IonListHeader, IonLabel, IonList } from "@ionic/vue";
	import ResourceCard from "../../components/ResourceCard.vue";

	import globeMD from "@material-symbols/svg-600/outlined/globe.svg";
	import newsMD from "@material-symbols/svg-600/outlined/news.svg";
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
				<ResourceCard
					url="https://ampersand.moe"
					:icon="globeMD"
					:title="$t('resources:website.title')"
					:description="$t('resources:website.desc')"
				/>

				<ResourceCard
					url="https://ampersand.moe/blog"
					:icon="newsMD"
					:title="$t('resources:blog.title')"
					:description="$t('resources:blog.desc')"
				/>

				<ResourceCard
					url="https://codeberg.org/Ampersand/app/wiki"
					:icon="wikiMD"
					:title="$t('resources:wiki.title')"
					:description="$t('resources:wiki.desc')"
				/>

				<ResourceCard
					url="https://codeberg.org/Ampersand/app"
					:icon="CodebergLogo"
					:title="$t('resources:repository.title')"
					:description="$t('resources:repository.desc')"
				/>
			</IonList>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	ion-list-header {
		text-align: center;
		font-size: 1.25em;
		color: var(--ion-text-color);
	}

	ion-list {
		gap: 8px;
		border-radius: none;
	}
</style>