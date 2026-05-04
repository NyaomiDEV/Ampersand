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
		IonRange,
		IonToggle
	} from "@ionic/vue";

	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { onBeforeMount, ref, toRaw, watch } from "vue";
	import { Reminder } from "../../lib/db/entities";
	import { getReminder, newReminder, removeReminder, updateReminder } from "../../lib/db/tables/reminders";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { useTranslation } from "i18next-vue";
	import { promptOkCancel, toast } from "../../lib/util/misc";

	const route = useRoute();
	const router = useIonRouter();
	const i18next = useTranslation();

	const loading = ref(false);

	const emptyReminder: PartialBy<Reminder, "uuid"> = {
		active: false,
		title: "",
		message: "",
		members: [],
		trigger: "fronting",
		delay: 0
	};
	const reminder = ref<PartialBy<Reminder, "uuid">>({ ...emptyReminder });

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

	async function save(){
		const uuid = reminder.value?.uuid;
		const _reminder = toRaw(reminder.value);

		try{
			if(!uuid) {
				const result = await newReminder({ ..._reminder });
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				router.back();
				return;
			}

			const result = await updateReminder(_reminder as Reminder);
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

			router.back();
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function updateRoute(){
		if(route.name !== "ReminderEdit") return;

		if(route.query.uuid){
			const rem = await getReminder(route.query.uuid as string);
			if(rem) reminder.value = rem;
			else reminder.value = { ...emptyReminder };
		} else reminder.value = { ...emptyReminder };
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
				<IonTitle>{{ $t("reminders:edit.header") }}</IonTitle>
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
					{{ $t("reminders:edit.eventBased.title") }}
				</IonLabel>
			</IonListHeader>

			<IonList>
				<IonRadioGroup v-model="reminder.trigger">
					<IonItem>
						<IonRadio value="fronting" justify="space-between">
							{{ $t("reminders:edit.eventBased.addedToFront") }}
						</IonRadio>
					</IonItem>
					<IonItem>
						<IonRadio value="fronted" justify="space-between">
							{{ $t("reminders:edit.eventBased.removedFromFront") }}
						</IonRadio>
					</IonItem>
				</IonRadioGroup>
			</IonList>

			<IonList>
				<IonItem>
					<IonRange
						v-model="reminder.delay"
						:label="$t('reminders:edit.eventBased.delay.title')"
						label-placement="stacked"
						:min="0"
						:max="1000 * 60 * 60"
						:step="1000 * 60 * 5"
						:snaps="true"
						:ticks="false"
						:pin="true"
						:pin-formatter="(v) => `${v / 1000 / 60}`"
					/>
				</IonItem>
			</IonList>

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
				<IonFabButton :disabled="!reminder.title.length" @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

