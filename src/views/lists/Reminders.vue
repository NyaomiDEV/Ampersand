<script setup lang="ts">
	import { IonContent, IonFab, IonFabButton, IonIcon, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonLabel, IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonItem } from "@ionic/vue";
	import { onBeforeMount, onUnmounted, ref, shallowRef, watch } from "vue";
	import { useRoute } from "vue-router";

	import { Reminder } from "../../lib/db/entities";
	import { getReminders } from "../../lib/db/tables/reminders";
	import { DatabaseEvent, DatabaseEvents } from "../../lib/db/events";

	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";

	import addMD from "@material-symbols/svg-600/rounded/add.svg";
	import { platform } from "@tauri-apps/plugin-os";
	import TheresNothingHere from "../../components/TheresNothingHere.vue";
	import CollapsibleHeaderbar from "../../components/CollapsibleHeaderbar.vue";

	const isStandalone = ref(false);

	const route = useRoute();

	const isUnsupportedPlatform = !["macos", "ios", "android"].includes(platform());

	const reminders = shallowRef<Reminder[]>();

	const listener = (event: Event) => {
		if(["reminders"].includes((event as DatabaseEvent).data.table))
			void Array.fromAsync(getReminders()).then(res => reminders.value = res);
	};

	watch(route, () => {
		if(route.path.startsWith("/lists/")) isStandalone.value = true;
		else isStandalone.value = false;
	}, { immediate: true });

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		reminders.value = await Array.fromAsync(getReminders());
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});
</script>

<template>
	<IonPage>
		<SpinnerFullscreen v-if="!reminders" />
		<IonContent v-else scroll-events>
			<CollapsibleHeaderbar class="size-large">
				<IonToolbar>
					<IonBackButton
						v-if="isStandalone"
						slot="start"
						default-href="/"
					/>
					<IonTitle>
						{{ $t("reminders:header") }}
					</IonTitle>
				</IonToolbar>
			</CollapsibleHeaderbar>

			<IonCard v-if="isUnsupportedPlatform" color="warning">
				<IonCardHeader>
					<IonCardTitle>{{ $t("reminders:notOnPC.header") }}</IonCardTitle>
				</IonCardHeader>
				<IonCardContent>{{ $t("reminders:notOnPC.content") }}</IonCardContent>
			</IonCard>

			<TheresNothingHere v-if="!reminders.length" sibling-header />
			<IonList>
				<IonItem
					v-for="reminder in reminders"
					:key="reminder.uuid"
					button
					detail
					:class="{ inactive: !reminder.active }"
					:router-link="`/edit/reminder?uuid=${reminder.uuid}`"
				>
					<IonLabel>
						<h3>{{ reminder.title }}</h3>
						<p>{{ reminder.message }}</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton router-link="/edit/reminder">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	ion-card {
		margin: 16px;
	}

	ion-item.inactive {
		opacity: .5;
	}
</style>