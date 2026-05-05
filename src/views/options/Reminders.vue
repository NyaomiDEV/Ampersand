<script setup lang="ts">
	import { IonContent, IonHeader, IonFab, IonFabButton, IonIcon, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonLabel, IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonItem } from "@ionic/vue";
	import { onBeforeMount, onUnmounted, shallowRef } from "vue";

	import { Reminder } from "../../lib/db/entities";
	import { getReminders } from "../../lib/db/tables/reminders";
	import { DatabaseEvent, DatabaseEvents } from "../../lib/db/events";

	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import { platform } from "@tauri-apps/plugin-os";

	const isUnsupportedPlatform = !["macos", "ios", "android"].includes(platform());

	const reminders = shallowRef<Reminder[]>();

	const listener = (event: Event) => {
		if(["reminders"].includes((event as DatabaseEvent).data.table))
			void Array.fromAsync(getReminders()).then(res => reminders.value = res);
	};

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
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					default-href="/options/"
				/>
				<IonTitle>
					{{ $t("reminders:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!reminders" />
		<IonContent v-else>
			<IonCard v-if="isUnsupportedPlatform" color="warning">
				<IonCardHeader>
					<IonCardTitle>{{ $t("reminders:notOnPC.header") }}</IonCardTitle>
				</IonCardHeader>
				<IonCardContent>{{ $t("reminders:notOnPC.content") }}</IonCardContent>
			</IonCard>

			<IonList>
				<IonItem
					v-for="reminder in reminders"
					:key="reminder.uuid"
					button
					detail
					:class="{ inactive: !reminder.active }"
					:router-link="`/options/reminders/edit?uuid=${reminder.uuid}`"
				>
					<IonLabel>
						<h3>{{ reminder.title }}</h3>
						<p>{{ reminder.message }}</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton router-link="/options/reminders/edit">
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