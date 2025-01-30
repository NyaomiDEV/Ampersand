<script setup lang="ts">
	import { IonContent, IonHeader, IonFab, IonListHeader, IonFabButton, IonIcon, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonLabel, IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonItem, IonToggle, ToggleChangeEventDetail } from '@ionic/vue';
	import { inject, onBeforeMount, onUnmounted, shallowRef } from 'vue';
	import { addOutline as addIOS } from "ionicons/icons";

	import Spinner from '../../components/Spinner.vue';
	import addMD from "@material-design-icons/svg/outlined/add.svg";
	import { Reminder } from '../../lib/db/entities';
	import { getReminders } from '../../lib/db/tables/reminders';
	import { DatabaseEvent, DatabaseEvents } from '../../lib/db/events';

	const isIOS = inject<boolean>("isIOS");

	const reminders = shallowRef<Reminder[]>();

	const listener = async (event: Event) => {
		if(["reminders"].includes((event as DatabaseEvent).data.table))
			reminders.value = await getReminders();
	}

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		reminders.value = await getReminders();
	});

	onUnmounted(async () => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function toggleReminder(reminder: Reminder, e: CustomEvent<ToggleChangeEventDetail>){
		console.log(reminder, e);
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:reminders.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<div v-if="!reminders" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; --spinner-size: 72px; --spinner-width: 5px">
			<Spinner />
		</div>
		<IonContent v-else>
			<!-- remove this when its completed -->
			<IonCard color="warning">
				<IonCardHeader>
					<IonCardTitle>{{ $t("other:remindersAreNotFinished.header") }}</IonCardTitle>
				</IonCardHeader>
				<IonCardContent>{{ $t("other:remindersAreNotFinished.content") }}</IonCardContent>
			</IonCard>

			<IonListHeader>
				<IonLabel>
					{{ $t("options:reminders.eventBasedLocale") }}
				</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS">
				<IonItem button
					v-for="eventReminder in reminders?.filter(x => x.type === 'event')"
					:key="'eventreminder'+JSON.stringify(eventReminder)"
					:routerLink="'/options/reminders/edit?uuid='+eventReminder.uuid"
				>
					<IonLabel>
						{{ eventReminder.name }}
					</IonLabel>

					<div slot="end">
						<IonToggle
							:checked="!!eventReminder.nativeId"
							@click="(e) => e.stopPropagation()"
							@["ion-change"]="(e) => toggleReminder(eventReminder, e)"
						/>
					</div>
				</IonItem>
			</IonList>

			<IonListHeader>
				<IonLabel>
					{{ $t("options:reminders.periodicLocale") }}
				</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS">
				<IonItem button
					v-for="periodicReminder in reminders?.filter(x => x.type === 'periodic')"
					:key="'periodicreminder'+JSON.stringify(periodicReminder)"
					:routerLink="'/options/reminders/edit?uuid='+periodicReminder.uuid"
				>
					<IonLabel>
						{{ periodicReminder.name }}
					</IonLabel>

					<div slot="end">
						<IonToggle
							:checked="!!periodicReminder.nativeId"
							@click="(e) => e.stopPropagation()"
							@["ion-change"]="(e) => toggleReminder(periodicReminder, e)"
						/>
					</div>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton routerLink="/options/reminders/edit">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>
