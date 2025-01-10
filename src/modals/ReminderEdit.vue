<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonButton,
		IonIcon,
		IonList,
		IonInput,
		IonSegment,
		IonListHeader,
		IonFab,
		IonFabButton,
		IonLabel,
		IonItem,
		modalController,
		IonModal,
		IonButtons,
		IonRadioGroup,
		IonRadio
	} from "@ionic/vue";

	import {
		saveOutline as saveIOS,
		chevronBack as backIOS,
	} from "ionicons/icons";

	import saveMD from "@material-design-icons/svg/outlined/save.svg";
	import backMD from "@material-design-icons/svg/outlined/arrow_back.svg";

	import MD3SegmentButton from '../components/MD3SegmentButton.vue';

	import { inject, ref } from "vue";
	import { PartialBy } from "../lib/types";
	import { EventReminder, Reminder } from "../lib/db/entities";

	const isIOS = inject<boolean>("isIOS")!;

	const props = defineProps<{
		reminder: PartialBy<Reminder, "uuid">
	}>();

	const reminder = ref(props.reminder);
	const self = ref();

	async function present() {
		reminder.value = props.reminder;
	}
</script>

<template>
	<IonModal class="reminder-edit-modal" ref="self" @willPresent="present">
		<IonHeader>
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton shape="round" fill="clear" @click="self.$el.dismiss()">
						<IonIcon slot="icon-only" :md="backMD" :ios="backIOS"></IonIcon>
					</IonButton>
				</IonButtons>
				<IonTitle>{{ $t("options:reminders.editReminder.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>

			<IonList :inset="isIOS">

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('options:reminders.editReminder.reminderName')" />
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('options:reminders.editReminder.reminderMessage')" />
				</IonItem>

				<IonItem>
					<IonLabel>
						<h3 class="centered-text">{{ $t("options:reminders.editReminder.reminderType.title") }}</h3>
							<IonSegment class="segment-alt" value="reminder-type" v-model="reminder.type">

								<MD3SegmentButton value="event">
									<IonLabel>{{ $t("options:reminders.editReminder.reminderType.eventBased") }}</IonLabel>
								</MD3SegmentButton>

								<MD3SegmentButton value="periodic">
									<IonLabel>{{ $t("options:reminders.editReminder.reminderType.periodic") }}</IonLabel>
								</MD3SegmentButton>
						</IonSegment>
					</IonLabel>
				</IonItem>
			</IonList>

				<template v-if="reminder.type == 'event'">
					<IonListHeader>
						<IonLabel>
							{{ $t("options:reminders.editReminder.eventBased.title") }}
						</IonLabel>
					</IonListHeader>

					<IonList :inset="isIOS">
						<IonRadioGroup v-model="(reminder as EventReminder).triggeringEvent.type">
							<IonItem>
								<IonRadio value="memberAdded" justify="space-between">
									{{ $t("options:reminders.editReminder.eventBased.addedToFront") }}
								</IonRadio>
							</IonItem>

							<IonItem>
								<IonRadio value="memberRemoved" justify="space-between">
									{{ $t("options:reminders.editReminder.eventBased.removedFromFront") }}
								</IonRadio>
							</IonItem>
						</IonRadioGroup>
					</IonList>

					<IonListHeader>
						<IonLabel>
							{{ $t("options:reminders.editReminder.eventBased.timing.title") }}
						</IonLabel>
					</IonListHeader>

					<IonList>
						<IonItem button :detail="true">
							<IonLabel>
								<h3>{{ $t("options:reminders.editReminder.eventBased.timing.delay") }}</h3>
								<p>aaa</p>
							</IonLabel>

						</IonItem>

					</IonList>
				</template>


			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton>
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonModal>
</template>


<style scoped>
	.md ion-input {
		margin: 16px 0;
	}
</style>