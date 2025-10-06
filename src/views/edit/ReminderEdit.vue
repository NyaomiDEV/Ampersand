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
		IonBackButton,
		useIonRouter,
	} from "@ionic/vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import MD3SegmentButton from "../../components/MD3SegmentButton.vue";
	import PopupPicker from "../../components/PopupPicker.vue";

	import { onBeforeMount, ref, toRaw, useTemplateRef, watch } from "vue";
	import { EventReminder, Reminder } from "../../lib/db/entities";
	import { getReminder, newReminder, removeReminder, updateReminder } from "../../lib/db/tables/reminders";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { useTranslation } from "i18next-vue";
	import { promptOkCancel } from "../../lib/util/misc";

	const route = useRoute();
	const router = useIonRouter();
	const i18next = useTranslation();

	const loading = ref(false);

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

	const eventDelayPopupPicker = useTemplateRef("eventDelayPopupPicker");
	const periodicTimeOfDayPopupPicker = useTemplateRef("periodicTimeOfDayPopupPicker");
	const periodicDayOfMonthPopupPicker = useTemplateRef("periodicDayOfMonthPopupPicker");

	async function deleteReminder(){
		if(await promptOkCancel(
			i18next.t("reminders:edit.delete.title"),
			i18next.t("reminders:edit.delete.confirm")
		)){
			await removeReminder(reminder.value.uuid!);
			router.back();
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
			router.back();
			return;
		}

		await updateReminder(uuid, { ..._reminder } as Reminder);
		router.back();
	}

	function switchType() {
		if(reminder.value.type === "event"){
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

	async function updateRoute(){
		if(route.name !== "ReminderEdit") return;

		if(route.query.uuid){
			const rem = await getReminder(route.query.uuid as string);
			if(rem) reminder.value = rem;
			else reminder.value = {...emptyReminder};
		} else reminder.value = {...emptyReminder};
	}

	watch(route, updateRoute);
	onBeforeMount(updateRoute);

</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					:icon="backMD"
					default-href="/options/reminders/"
				/>
				<IonTitle>{{ $t("reminders:edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>

			<IonList>

				<IonItem>
					<IonInput
						v-model="reminder.name"
						fill="outline"
						label-placement="floating"
						:label="$t('reminders:edit.name')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="reminder.title"
						fill="outline"
						label-placement="floating"
						:label="$t('reminders:edit.title')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="reminder.message"
						fill="outline"
						label-placement="floating"
						:label="$t('reminders:edit.message')"
					/>
				</IonItem>

				<IonItem>
					<IonLabel>
						<h3 class="centered-text">{{ $t("reminders:edit.type.title") }}</h3>
						<IonSegment
							v-model="reminder.type"
							class="segment-alt"
							value="reminder-type"
							@update:model-value="switchType"
						>

							<MD3SegmentButton value="event">
								<IonLabel>{{ $t("reminders:edit.type.eventBased") }}</IonLabel>
							</MD3SegmentButton>

							<MD3SegmentButton value="periodic">
								<IonLabel>{{ $t("reminders:edit.type.periodic") }}</IonLabel>
							</MD3SegmentButton>
						</IonSegment>
					</IonLabel>
				</IonItem>

			</IonList>

			<template v-if="reminder.type === 'event'">
				<IonListHeader>
					<IonLabel>
						{{ $t("reminders:edit.eventBased.title") }}
					</IonLabel>
				</IonListHeader>

				<IonList>
					<IonRadioGroup v-model="(reminder as EventReminder).triggeringEvent.type">
						<IonItem>
							<IonRadio value="memberAdded" justify="space-between">
								{{ $t("reminders:edit.eventBased.addedToFront") }}
							</IonRadio>
						</IonItem>
						<IonItem>
							<IonRadio value="memberRemoved" justify="space-between">
								{{ $t("reminders:edit.eventBased.removedFromFront") }}
							</IonRadio>
						</IonItem>
					</IonRadioGroup>

					<IonItem>
						<IonInput
							v-model="(reminder as EventReminder).triggeringEvent.filterQuery"
							fill="outline"
							label-placement="floating"
							:label="$t('reminders:edit.eventBased.memberFilterQuery')"
						/>
					</IonItem>

				</IonList>

				<IonListHeader>
					<IonLabel>
						{{ $t("reminders:edit.eventBased.timing") }}
					</IonLabel>
				</IonListHeader>

				<IonList>
					<IonItem button :detail="true" @click="() => eventDelayPopupPicker?.$el.present()">
						<IonLabel>
							<h3>{{ $t("reminders:edit.eventBased.delay.title") }}</h3>
							<p>{{ $t("reminders:edit.eventBased.delay.desc", {delay: reminder.delay?.hours.toString().padStart(2, "0") + ":" + reminder.delay?.minutes.toString().padStart(2, "0") }) }}</p>
						</IonLabel>
					</IonItem>
				</IonList>

				<PopupPicker
					ref="eventDelayPopupPicker"
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
					@update:model-value="v => {
						reminder.delay = {
							hours: Number(v.get('hours')) || 0,
							minutes: Number(v.get('minutes')) || 0
						}
					}"
				/>

			</template>

			<template v-if="reminder.type === 'periodic'">
				<IonListHeader>
					<IonLabel>
						{{ $t("reminders:edit.periodic.title") }}
					</IonLabel>
				</IonListHeader>

				<IonList>
					<IonItem button :detail="true" @click="() => periodicTimeOfDayPopupPicker?.$el.present()">
						<IonLabel>
							<h3>{{ $t("reminders:edit.periodic.timeOfDay.title") }}</h3>
							<p>{{ $t("reminders:edit.periodic.timeOfDay.desc", {timeOfDay: reminder.scheduleInterval?.hourOfDay?.toString().padStart(2, "0") + ":" + reminder.scheduleInterval?.minuteOfHour?.toString().padStart(2, "0") }) }}</p>
						</IonLabel>
					</IonItem>
				</IonList>

				<PopupPicker
					ref="periodicTimeOfDayPopupPicker"
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
					@update:model-value="v => {
						if(reminder.scheduleInterval){
							reminder.scheduleInterval.hourOfDay = Number(v.get('hours')) || 0;
							reminder.scheduleInterval.minuteOfHour = Number(v.get('minutes')) || 0;
						}
					}"
				/>

				<IonList>
					<IonItem button :detail="true" @click="() => periodicDayOfMonthPopupPicker?.$el.present()">
						<IonLabel>
							<h3>{{ $t("reminders:edit.periodic.dayOfMonth.title") }}</h3>
							<p>
								{{ 
									reminder.scheduleInterval?.dayOfMonth === undefined
										? $t("reminders:edit.periodic.dayOfMonth.desc_undefined")
										: $t("reminders:edit.periodic.dayOfMonth.desc", { count: reminder.scheduleInterval?.dayOfMonth, ordinal: true })
								}}
							</p>
						</IonLabel>
					</IonItem>
				</IonList>

				<PopupPicker
					ref="periodicDayOfMonthPopupPicker"
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
					@update:model-value="v => {
						const val = v.get('dayOfMonth');
						if(reminder.scheduleInterval)
							reminder.scheduleInterval.dayOfMonth = val !== undefined ? Number(val) : undefined;
					}"
				/>
			</template>

			<IonItem
				v-if="reminder.uuid"
				button
				:detail="false"
				@click="deleteReminder"
			>
				<IonIcon
					slot="start"
					:icon="trashMD"
					aria-hidden="true"
					color="danger"
				/>
				<IonLabel color="danger">
					<h3>{{ $t("reminders:edit.delete.title") }}</h3>
					<p>{{ $t("other:genericDeleteDesc") }}</p>
				</IonLabel>
			</IonItem>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="reminder.name.length > 0" @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

<style scoped>

	ion-radio::part(label) {
		text-wrap-mode: wrap;
	}

</style>
