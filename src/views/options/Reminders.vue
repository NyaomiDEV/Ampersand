<script setup lang="ts">
	import { IonContent, IonHeader, IonFab, IonFabButton, IonIcon, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonLabel, IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonItem, IonToggle, ToggleChangeEventDetail } from "@ionic/vue";
	import { onBeforeMount, onUnmounted, shallowRef } from "vue";

	import { Reminder } from "../../lib/db/entities";
	import { getReminders, updateReminder } from "../../lib/db/tables/reminders";
	import { DatabaseEvent, DatabaseEvents } from "../../lib/db/events";

	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import { toast } from "../../lib/util/misc";

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

	async function toggleReminder(reminder: Reminder, e: CustomEvent<ToggleChangeEventDetail>){
		try {
			await updateReminder({
				uuid: reminder.uuid,
				active: e.detail.checked
			});
		}catch(e){
			console.error(e);
			await toast((e as Error).message);
		}
	}
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
			<!-- remove this when its completed -->
			<IonCard color="warning">
				<IonCardHeader>
					<IonCardTitle>{{ $t("reminders:remindersAreNotFinished.header") }}</IonCardTitle>
				</IonCardHeader>
				<IonCardContent>{{ $t("reminders:remindersAreNotFinished.content") }}</IonCardContent>
			</IonCard>

			<IonList>
				<IonItem
					v-for="reminder in reminders"
					:key="reminder.uuid"
					button
					:router-link="`/options/reminders/edit?uuid=${reminder.uuid}`"
				>
					<IonLabel>
						{{ reminder.title }}
					</IonLabel>

					<div slot="end">
						<IonToggle
							:checked="reminder.active"
							@click="(e) => e.stopPropagation()"
							@ion-change="(e) => toggleReminder(reminder, e)"
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
