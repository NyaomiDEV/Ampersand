<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonList,
		IonInput,
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
		IonToggle
	} from "@ionic/vue";

	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { onBeforeMount, ref, toRaw, useTemplateRef, watch } from "vue";
	import { ReminderComplete } from "../../lib/db/entities";
	import { getReminder, newReminder, removeReminder, toReminderComplete, updateReminder } from "../../lib/db/tables/reminders";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { useTranslation } from "i18next-vue";
	import { promptOkCancel, sortName, toast } from "../../lib/util/misc";
	import MemberSelect from "../../modals/MemberSelect.vue";
	import MemberChip from "../../components/member/MemberChip.vue";
	import PopupPicker from "../../components/PopupPicker.vue";

	const route = useRoute();
	const router = useIonRouter();
	const i18next = useTranslation();

	const loading = ref(false);

	const emptyReminder: PartialBy<ReminderComplete, "uuid"> = {
		active: false,
		title: "",
		message: "",
		trigger: "fronting",
		delay: 0
	};
	const reminder = ref<PartialBy<ReminderComplete, "uuid">>({ ...emptyReminder });

	const delayMap = ref(new Map([["hours", 0], ["minutes", 0]]));

	const allMembers = ref(false);

	const memberSelectModal = useTemplateRef("memberSelectModal");
	const popupPicker = useTemplateRef("popupPicker");

	async function deleteReminder(){
		try{
			if(await promptOkCancel(
				i18next.t("reminders:edit.delete.title"),
				undefined,
				i18next.t("reminders:edit.delete.confirm")
			)){
				const result = await removeReminder(reminder.value.uuid!);
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				router.back();
			}
		}catch(e){
			await toast((e as Error).message);
		}
	}

	function syncDelayMap(){
		const minutes = Math.floor(reminder.value.delay / 1000 / 60) % 60;
		const hours = Math.floor(reminder.value.delay / 1000 / 60 / 60);

		delayMap.value.set("minutes", minutes);
		delayMap.value.set("hours", hours);
	}

	async function save(){
		const uuid = reminder.value?.uuid;
		const _reminder = toRaw(reminder.value);

		if(allMembers.value)
			_reminder.members = undefined;

		_reminder.delay = ((delayMap.value.get("hours") || 0) * 60 * 60 * 1000) + ((delayMap.value.get("minutes") || 0) * 60 * 1000);

		try{
			if(!uuid) {
				const result = await newReminder({
					..._reminder,
					members: _reminder.members ? _reminder.members.map(x => x.uuid) : undefined
				});
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				router.back();
				return;
			}

			const result = await updateReminder({
				uuid,
				..._reminder,
				members: _reminder.members ? _reminder.members.map(x => x.uuid) : undefined
			});
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

			router.back();
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function updateRoute(){
		if(route.name !== "ReminderEdit") return;

		if(route.query.uuid){
			const rem = await toReminderComplete(await getReminder(route.query.uuid as string));
			if(rem) reminder.value = rem;
			else reminder.value = { ...emptyReminder };
		} else reminder.value = { ...emptyReminder };

		allMembers.value = !reminder.value.members;
		syncDelayMap();
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
					default-href="/options/reminders/"
				/>
				<IonTitle>{{ reminder.uuid ? $t("reminders:edit.header") : $t("reminders:edit.headerAdd") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>

			<IonList>
				<IonItem>
					<IonToggle v-model="reminder.active">
						<IonLabel>{{ $t("reminders:edit.active") }}</IonLabel>
					</IonToggle>
				</IonItem>
			</IonList>

			<IonList class="surface">
				<IonItem>
					<IonInput
						v-model="reminder.title"
						fill="solid"
						label-placement="floating"
						:label="$t('reminders:edit.title')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="reminder.message"
						fill="solid"
						label-placement="floating"
						:label="$t('reminders:edit.message')"
					/>
				</IonItem>
			</IonList>

			<IonListHeader>
				<IonLabel>
					{{ $t("reminders:edit.triggeringEvent.title") }}
				</IonLabel>
			</IonListHeader>

			<IonList>
				<IonRadioGroup v-model="reminder.trigger">
					<IonItem>
						<IonRadio value="fronting" justify="space-between">
							{{ $t("reminders:edit.triggeringEvent.addedToFront") }}
						</IonRadio>
					</IonItem>
					<IonItem>
						<IonRadio value="fronted" justify="space-between">
							{{ $t("reminders:edit.triggeringEvent.removedFromFront") }}
						</IonRadio>
					</IonItem>
				</IonRadioGroup>

				<IonItem>
					<IonToggle v-model="allMembers">
						<IonLabel>{{ $t("reminders:edit.triggerOnAllMembers") }}</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem
					v-if="!allMembers"
					button
					detail
					@click="memberSelectModal?.$el.present()"
				>
					<IonLabel>
						<h3>{{ $t("reminders:edit.members") }}</h3>
						<p v-if="reminder.members?.length">
							<MemberChip v-for="member in reminder.members.toSorted(sortName)" :key="member.uuid" :member />
						</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonList>
				<IonItem detail button @click="popupPicker?.$el.present()">
					<IonLabel>
						<h2>{{ $t("reminders:edit.delay") }}</h2>
						<p>{{ delayMap.get("hours")?.toString().padStart(2, "0") || "00" }}:{{ delayMap.get("minutes")?.toString().padStart(2, "0") || "00" }}</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonList>
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
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton :disabled="!reminder.title.length" @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>

		<MemberSelect
			ref="memberSelectModal"
			v-model="reminder.members"
			:custom-title="$t('reminders:edit.members')"
			:hide-checkboxes="false"
			:always-emit="true"
		/>

		<PopupPicker
			ref="popupPicker"
			v-model="delayMap"
			:content="[
				{
					name: 'hours',
					values: [...Array(24).keys().map(x => ({
						name: x.toString().padStart(2, '0'),
						value: x,
						default: x === 0
					}))],
					suffix: $t('other:timeSizes.hours.long')
				},
				{
					name: 'minutes',
					values: [...Array(60).keys().map(x => ({
						name: x.toString().padStart(2, '0'),
						value: x,
						default: x === 0
					}))],
					suffix: $t('other:timeSizes.minutes.long')
				}
			]"
		/>
	</IonPage>
</template>

<style scoped>
	ion-item, ion-radio::part(label) {
		text-wrap: wrap !important;
	}
</style>