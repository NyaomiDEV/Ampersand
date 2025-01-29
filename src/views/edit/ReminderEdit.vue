<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonList,
		IonInput,
		IonSegment,
		IonListHeader,
		IonFab,
		IonFabButton,
		IonLabel,
		IonItem,
		IonRadioGroup,
		IonRadio,
		IonPage,
		IonBackButton
	} from "@ionic/vue";

	import {
		saveOutline as saveIOS,
	} from "ionicons/icons";

	import saveMD from "@material-design-icons/svg/outlined/save.svg";

	import MD3SegmentButton from '../../components/MD3SegmentButton.vue';
	import PopupPicker from "../../components/PopupPicker.vue";

	import { inject, onBeforeMount, reactive, ref, toRaw, watch } from "vue";
	import { EventReminder, Reminder } from "../../lib/db/entities";
	import { getReminders, newReminder, updateReminder } from "../../lib/db/tables/reminders";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";

	const isIOS = inject<boolean>("isIOS")!;
	const route = useRoute();

	const emptyReminder: PartialBy<Reminder, "uuid"> = {
		name: "",
		type: "event",
		title: "",
		message: "",
		triggeringEvent: {
			type: "memberAdded"
		},
		delay: {
			hours: 0,
			minutes: 0
		}
	};
	const reminder = ref<PartialBy<Reminder, "uuid">>({...emptyReminder});

	const eventDelayPopupPicker = ref();
	const periodicTimeOfDayPopupPicker = ref();
	const periodicDayOfMonthPopupPicker = ref();

	const eventDelayPickerValue = reactive(new Map<string, number>());
	const periodicTimeOfDayPickerValue = reactive(new Map<string, number>([['hours', 0], ['minutes', 0]]));

	async function updateRoute(){
		if(route.query.uuid){
			const rem = (await getReminders()).find(x => x.uuid === route.query.uuid);
			if(rem) reminder.value = rem;
			else reminder.value = emptyReminder;
		}
	}

	async function save(){
		const uuid = reminder.value?.uuid;
		const _reminder = toRaw(reminder.value);

		if(_reminder.type === "event"){
			if(_reminder.scheduleInterval)
				delete _reminder.scheduleInterval;
		} else {
			if(_reminder.triggeringEvent)
				delete _reminder.triggeringEvent;

			if(_reminder.delay)
				delete _reminder.delay;
		}

		if(!uuid) {
			await newReminder({..._reminder });
			return;
		}

		await updateReminder(uuid, { ..._reminder } as Reminder);
	}

	function switchType() {
		if(reminder.value.type == "event"){
			reminder.value.delay = {
				hours: 0,
				minutes: 0
			};
			reminder.value.triggeringEvent = {
				type: "memberAdded"
			};

			if(reminder.value.scheduleInterval)
				delete reminder.value.scheduleInterval;
		} else {
			reminder.value.scheduleInterval = {
				hourOfDay: 0,
				minuteOfHour: 0
			};

			if(reminder.value.triggeringEvent)
				delete reminder.value.triggeringEvent;

			if(reminder.value.delay)
				delete reminder.value.delay;
		}
	}

	watch(route, updateRoute);
	onBeforeMount(updateRoute);

	watch(eventDelayPickerValue, () => {
		reminder.value.delay = {
			hours: eventDelayPickerValue.get('hours') || 0,
			minutes: eventDelayPickerValue.get('minutes') || 0,
		}
	});

	watch(periodicTimeOfDayPickerValue, () => {
		if(reminder.value.scheduleInterval){
			reminder.value.scheduleInterval.hourOfDay = periodicTimeOfDayPickerValue.get('hours') || 0;
			reminder.value.scheduleInterval.minuteOfHour = periodicTimeOfDayPickerValue.get('minutes') || 0;
		}
	});

</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/reminders/" />
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
						<IonSegment class="segment-alt" value="reminder-type" v-model="reminder.type" @ionChange="switchType">

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

			<template v-if="reminder.type == 'periodic'">
				<IonListHeader>
					<IonLabel>
						{{ $t("options:reminders.editReminder.periodic.title") }}
					</IonLabel>
				</IonListHeader>

				<IonList>
					<IonItem button :detail="true" @click="() => periodicTimeOfDayPopupPicker.$el.present()">
						<IonLabel>
							<h3>{{ $t("options:reminders.editReminder.periodic.timeOfDay.title") }}</h3>
							<p>{{ $t("options:reminders.editReminder.periodic.timeOfDay.desc", {timeOfDay: reminder.scheduleInterval?.hourOfDay?.toString().padStart(2, "0") + ":" + reminder.scheduleInterval?.minuteOfHour?.toString().padStart(2, "0") })}}</p>
						</IonLabel>
					</IonItem>
				</IonList>

				<PopupPicker
					ref="periodicTimeOfDayPopupPicker"
					v-model="periodicTimeOfDayPickerValue"
					:content="[
						{
							name: 'hours',
							suffix: ':',
							values: Array.from({length: 24}, (_, i) => ({
								name: i.toString(),
								value: i
							}))
						},
						{
							name: 'minutes',
							values: Array.from({length: 60}, (_, i) => ({
								name: i.toString(),
								value: i
							}))
						},
					]"
				/>

				<IonList>
					<IonItem button :detail="true" @click="() => periodicDayOfMonthPopupPicker.$el.present()">
						<IonLabel>
							<h3>{{ $t("options:reminders.editReminder.periodic.dayOfMonth.title") }}</h3>
							<p>{{ 
								reminder.scheduleInterval?.dayOfMonth === undefined
								? $t("options:reminders.editReminder.periodic.dayOfMonth.desc_undefined")
								: $t("options:reminders.editReminder.periodic.dayOfMonth.desc", { count: reminder.scheduleInterval?.dayOfMonth, ordinal: true })
							}}</p>
						</IonLabel>
					</IonItem>
				</IonList>

				<PopupPicker
					ref="periodicDayOfMonthPopupPicker"
					@update:modelValue="v => {
						const val = v.get('dayOfMonth');
						reminder.scheduleInterval!.dayOfMonth = val !== undefined ? Number(val) : undefined;
					}"
					:content="[
						{
							name: 'dayOfMonth',
							values: [
								{
									name: '-',
									value: undefined
								},
								...Array.from({length: 31}, (_, i) => ({
									name: (i+1).toString(),
									value: i+1
								}))
							]
						}
					]"
				/>
			</template>


			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="reminder.name.length > 0">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
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