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
	import PopupPicker from "../components/PopupPicker.vue";

	import { inject, reactive, ref, toRaw, watch } from "vue";
	import { PartialBy } from "../lib/types";
	import { EventReminder, PeriodicReminder, Reminder } from "../lib/db/entities";
	import { newReminder, updateReminder } from "../lib/db/tables/reminders";

	const isIOS = inject<boolean>("isIOS")!;

	const props = defineProps<{
		reminder: PartialBy<Reminder, "uuid">
	}>();

	const reminder = ref(props.reminder);
	const self = ref();

	const eventDelayPopupPicker = ref();

	const eventDelayPickerValue = reactive(new Map<string, number>());

	async function save(){
		const uuid = reminder.value?.uuid;
		const _reminder = toRaw(reminder.value);

		if(_reminder.type === "event"){
			delete (_reminder as EventReminder).scheduleEveryDateInterval;
			delete (_reminder as EventReminder).scheduleEveryWeekdayInterval;
			delete (_reminder as EventReminder).scheduleTimeInterval;
		} else {
			delete (_reminder as PeriodicReminder).delay;
			delete (_reminder as PeriodicReminder).triggeringEvent;
		}

		if(!uuid) {
			await newReminder({..._reminder });

			await modalController.dismiss(null, "added");

			return;
		}

		await updateReminder(uuid, { ..._reminder } as Reminder);

		try{
			await modalController.dismiss(null, "modified");
		}catch(_){}
		// catch an error because the type might get changed, causing the parent to be removed from DOM
		// however it's safe for us to ignore
	}

	async function present() {
		reminder.value = props.reminder;
	}

	watch(eventDelayPickerValue, () => {
		reminder.value.delay = {
			hours: eventDelayPickerValue.get('hours') || 0,
			minutes: eventDelayPickerValue.get('minutes') || 0,
		}
	});

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
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating"
						:label="$t('options:reminders.editReminder.reminderName')" v-model="reminder.name" />
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating"
						:label="$t('options:reminders.editReminder.reminderTitle')" v-model="reminder.title" />
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating"
						:label="$t('options:reminders.editReminder.reminderMessage')" v-model="reminder.message" />
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

					<IonItem>
						<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating"
							:label="$t('options:reminders.editReminder.eventBased.memberFilterQuery')" v-model="(reminder as EventReminder).triggeringEvent.filterQuery" />
					</IonItem>

				</IonList>

				<IonListHeader>
					<IonLabel>
						{{ $t("options:reminders.editReminder.eventBased.timing") }}
					</IonLabel>
				</IonListHeader>

				<IonList>
					<IonItem button :detail="true" @click="() => eventDelayPopupPicker.$el.present()">
						<IonLabel>
							<h3>{{ $t("options:reminders.editReminder.eventBased.delay.title") }}</h3>
							<p>{{ $t("options:reminders.editReminder.eventBased.delay.desc", {delay: reminder.delay?.hours.toString().padStart(2, "0") + ":" + reminder.delay?.minutes.toString().padStart(2, "0") })}}</p>
						</IonLabel>
					</IonItem>
				</IonList>

				<PopupPicker
					ref="eventDelayPopupPicker"
					v-model="eventDelayPickerValue"
					:content="[
						{
							name: 'hours',
							suffix: $t('other:timeSizes.hours.short'),
							values: Array.from({length: 24}, (_, i) => ({
								name: i.toString(),
								value: i
							}))
						},
						{
							name: 'minutes',
							suffix: $t('other:timeSizes.minutes.short'),
							values: Array.from({length: 60}, (_, i) => ({
								name: i.toString(),
								value: i
							}))
						},
					]"
				/>

			</template>


			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="reminder.name.length > 0">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonModal>
</template>


<style scoped>
	ion-modal.reminder-edit-modal {
		--width: 100dvw;
		--height: 100dvh;
	}
	
	ion-content {
		--padding-bottom: 80px;
	}

	.md ion-input {
		margin: 16px 0;
	}
</style>