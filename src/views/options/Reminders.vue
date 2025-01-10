<script setup lang="ts">
	import { IonContent, IonHeader, IonFab, IonListHeader, IonFabButton, IonIcon, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonLabel } from '@ionic/vue';
	import { inject, ref, shallowRef } from 'vue';
	import { addOutline as addIOS } from "ionicons/icons";

	import addMD from "@material-design-icons/svg/outlined/add.svg";
	import { Reminder } from '../../lib/db/entities';
	import { PartialBy } from '../../lib/types';
	import ReminderEdit from '../../modals/ReminderEdit.vue';

	const isIOS = inject<boolean>("isIOS");

	const emptyReminder: PartialBy<Reminder, "uuid"> = {
		name: "",
		type: "event",
		title: "",
		message: ""
	};
	const reminder = shallowRef<PartialBy<Reminder, "uuid">>({...emptyReminder});

	const reminderEditModal = ref();

	async function showModal(clickedReminder?: Reminder){
		if(clickedReminder)
			reminder.value = {...clickedReminder};
		else {
			reminder.value = {...emptyReminder};
		}

		await reminderEditModal.value.$el.present();
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
		
		<IonContent>
			<IonListHeader>
				<IonLabel>
					{{ $t("options:reminders.eventBasedLocale") }}
				</IonLabel>
			</IonListHeader>
			
			<IonList :inset="isIOS"></IonList>

			<IonListHeader>
				<IonLabel>
					{{ $t("options:reminders.periodicLocale") }}
				</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS"></IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="showModal()">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>

		<ReminderEdit ref="reminderEditModal" :reminder />
	</IonPage>
</template>
