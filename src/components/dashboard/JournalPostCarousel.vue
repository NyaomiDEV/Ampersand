<script setup lang="ts">
	import { IonList, IonLabel, IonListHeader, useIonRouter, IonButton } from "@ionic/vue";
	import { onBeforeMount, onUnmounted, shallowRef } from "vue";
	import { getRecentJournalPosts, toJournalPostComplete } from "../../lib/db/tables/journalPosts.ts";
	import type { JournalPostComplete } from "../../lib/db/entities";

	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events.ts";
	import { appConfig } from "../../lib/config/index.ts";
	import JournalPostItem from "../journal/JournalPostItem.vue";
	import { promptOkCancel } from "../../lib/util/misc.ts";
	import { useTranslation } from "i18next-vue";

	const router = useIonRouter();
	const i18next = useTranslation();

	const posts = shallowRef<JournalPostComplete[]>();

	async function updateJournalPosts(){
		posts.value = await toJournalPostComplete(await getRecentJournalPosts(appConfig.dashboardSettings.journalPostCarousel.settings.maxDays));
	}

	async function openPost(post: JournalPostComplete){
		if(post.isPrivate){
			if(!await promptOkCancel(
				i18next.t("journal:private"),
				undefined,
				i18next.t("journal:alertSubheader")
			))
				return;
		}

		if(post.contentWarning?.length){
			if(!await promptOkCancel(
				i18next.t("journal:contentWarning"),
				i18next.t("journal:alertSubheader"),
				post.contentWarning
			))
				return;
		}

		router.push(`/edit/journal/?uuid=${post.uuid}`);
	}

	const listener = (event: Event) => {
		if(["members", "journalPosts"].includes((event as DatabaseEvent).data.table))
			void updateJournalPosts();
	};

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await updateJournalPosts();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});
</script>

<template>
	<IonListHeader>
		<IonLabel>{{ $t("dashboard:journal.header") }}</IonLabel>
	</IonListHeader>

	<IonList>
		<JournalPostItem
			v-for="post in posts"
			:key="post.uuid"
			:post
			show-tags
			show-date-in-date-time
			@click="openPost(post)"
		/>
	</IonList>

	<div>
		<IonButton size="small" router-link="/edit/journal/">{{ $t("journal:edit.headerAdd") }}</IonButton>
		<IonButton size="small" fill="clear" router-link="/journal/">{{ $t("dashboard:journal.view") }}</IonButton>
	</div>
</template>

<style scoped>
	div {
		display: flex;
		justify-content: center;
		gap: 16px;
	}
</style>
