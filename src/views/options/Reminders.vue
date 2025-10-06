<script setup lang="ts">
	import { IonContent, IonHeader, IonFab, IonListHeader, IonFabButton, IonIcon, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonLabel, IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonItem, IonToggle, ToggleChangeEventDetail } from "@ionic/vue";
	import { onBeforeMount, onUnmounted, shallowRef } from "vue";

	import { Reminder } from "../../lib/db/entities";
	import { getReminders } from "../../lib/db/tables/reminders";
	import { DatabaseEvent, DatabaseEvents } from "../../lib/db/events";

	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";

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

	async function toggleReminder(_reminder: Reminder, _e: CustomEvent<ToggleChangeEventDetail>){
		// do smth
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					:icon="backMD"
					default-href="/options/"
				/>
				<IonTitle>
					{{ $t("reminders:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!reminders" />
		<IonContent v-else>
			<!-- remove this when its completed -->
			<IonCard color="warning">
				<IonCardHeader>
					<IonCardTitle>{{ $t("reminders:remindersAreNotFinished.header") }}</IonCardTitle>
				</IonCardHeader>
				<IonCardContent>{{ $t("reminders:remindersAreNotFinished.content") }}</IonCardContent>
			</IonCard>

			<IonListHeader>
				<IonLabel>
					{{ $t("reminders:eventBasedHeader") }}
				</IonLabel>
			</IonListHeader>

			<IonList>
				<IonItem
					v-for="eventReminder in reminders?.filter(x => x.type === 'event')"
					:key="eventReminder.uuid"
					button
					:router-link="`/options/reminders/edit?uuid=${eventReminder.uuid}`"
				>
					<IonLabel>
						{{ eventReminder.name }}
					</IonLabel>

					<div slot="end">
						<IonToggle
							:checked="!!eventReminder.nativeId"
							@click="(e) => e.stopPropagation()"
							@ion-change="(e) => toggleReminder(eventReminder, e)"
						/>
					</div>
				</IonItem>
			</IonList>

			<IonListHeader>
				<IonLabel>
					{{ $t("reminders:periodicHeader") }}
				</IonLabel>
			</IonListHeader>

			<IonList>
				<IonItem
					v-for="periodicReminder in reminders?.filter(x => x.type === 'periodic')"
					:key="periodicReminder.uuid"
					button
					:router-link="`/options/reminders/edit?uuid=${periodicReminder.uuid}`"
				>
					<IonLabel>
						{{ periodicReminder.name }}
					</IonLabel>

					<div slot="end">
						<IonToggle
							:checked="!!periodicReminder.nativeId"
							@click="(e) => e.stopPropagation()"
							@ion-change="(e) => toggleReminder(periodicReminder, e)"
						/>
					</div>
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
