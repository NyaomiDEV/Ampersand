<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonList,
		IonFab,
		IonFabButton,
		IonLabel,
		IonToggle,
		IonInput,
		IonItem,
		modalController,
		IonModal
	} from "@ionic/vue";

	import {
		saveOutline as saveIOS,
		trashBinOutline as trashIOS
	} from "ionicons/icons";

	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { FrontingEntryComplete } from "../lib/db/entities";
	import { newFrontingEntry, updateFrontingEntry, deleteFrontingEntry } from '../lib/db/tables/frontingEntries';
	import { Ref, inject, ref, toRaw, useTemplateRef, watch } from "vue";

	import MemberSelect from "./MemberSelect.vue";
	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import DatePopupPicker from "../components/DatePopupPicker.vue";

	import dayjs from "dayjs";
	import UTC from "dayjs/plugin/utc";
	import Timezone from "dayjs/plugin/timezone";
	import { PartialBy } from "../lib/types";
	import { formatDate } from "../lib/util/misc";
	dayjs.extend(UTC);
	dayjs.extend(Timezone);

	const isIOS = inject<boolean>("isIOS");

	const props = defineProps<{
		frontingEntry?: PartialBy<FrontingEntryComplete, "uuid" | "member">
	}>();

	const emptyFrontingEntry: PartialBy<FrontingEntryComplete, "uuid" | "member"> = {
		isMainFronter: false,
		startTime: new Date(),
		endTime: new Date(),
	};
	const frontingEntry = ref({...(props.frontingEntry || emptyFrontingEntry)});

	const memberSelectModal = useTemplateRef("memberSelectModal");

	const startTime: Ref<string | undefined> = ref(dayjs(frontingEntry.value.startTime).format());
	const endTime: Ref<string | undefined> = ref();
	if(frontingEntry.value.endTime)
		endTime.value = dayjs(frontingEntry.value.endTime).format();

	watch(startTime, () => {
		frontingEntry.value.startTime = dayjs(startTime.value).toDate();
	}, {immediate: true });

	watch(endTime, () => {
		if(endTime.value)
			frontingEntry.value.endTime = dayjs(endTime.value).toDate();
	}, {immediate: true });

	async function save(){
		const uuid = frontingEntry.value?.uuid;
		const _frontingEntry = toRaw(frontingEntry.value);

		if(!_frontingEntry.member) return;

		if(!uuid) {
			await newFrontingEntry({..._frontingEntry, member: _frontingEntry.member.uuid });

			await modalController.dismiss(null, "added");

			return;
		}

		await updateFrontingEntry(uuid, {
			..._frontingEntry,
			member: _frontingEntry.member.uuid
		});

		try{
			await modalController.dismiss(null, "modified");
		}catch(_){}
		// catch an error because the type might get changed, causing the parent to be removed from DOM
		// however it's safe for us to ignore
	}

	async function _deleteFrontingEntry(){
		if(!frontingEntry.value.uuid) return;

		await deleteFrontingEntry(frontingEntry.value.uuid);
		try{
			await modalController.dismiss(undefined, "deleted");
		}catch(_){}
	}

	function removeFromFront() {
		frontingEntry.value.endTime = new Date();
		endTime.value = dayjs(frontingEntry.value.endTime).format("YYYY-MM-DDTHH:mm:ss");
	}
</script>

<template>
	<IonModal class="fronting-entry-edit-modal" :breakpoints="[0,1]" initialBreakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("options:frontHistory.edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
					<IonItem button @click="memberSelectModal?.$el.present()">
						<template v-if="frontingEntry.member">
							<MemberAvatar slot="start" :member="frontingEntry.member" />
							<IonLabel>
								<h2>{{ frontingEntry.member.name }}</h2>
								<p>{{ $t("options:frontHistory.edit.member") }}</p>
							</IonLabel>
						</template>
						<template v-else>
							<IonLabel>
								<h2>{{ $t("options:frontHistory.edit.member") }}</h2>
							</IonLabel>
						</template>
					</IonItem>
					<IonItem>
						<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('options:frontHistory.edit.customStatus')" labelPlacement="floating" v-model="frontingEntry.customStatus" />
					</IonItem>
					<IonItem button @click="$refs.startTimePicker?.$el.present()">
						<IonLabel>
							<h2>{{ $t("options:frontHistory.edit.startTime") }}</h2>
							<p>{{ formatDate(frontingEntry.startTime, true) }}</p>
						</IonLabel>
						<DatePopupPicker
							v-model="startTime"
							showDefaultButtons
							ref="startTimePicker"
							:title="$t('options.frontHistory.edit.startTime')"
							:max="frontingEntry.endTime || new Date()"
						/>
					</IonItem>
					<IonItem button v-if="!frontingEntry.endTime" @click="removeFromFront">
						<IonLabel>
							<h2>{{ $t("options:frontHistory.edit.removeFromFront.title") }}</h2>
							<p>{{ $t("options:frontHistory.edit.removeFromFront.desc") }}</p>
						</IonLabel>
					</IonItem>
					<IonItem button v-if="frontingEntry.endTime" @click="$refs.endTimePicker?.$el.present()">
						<IonLabel>
							<h2>{{ $t("options:frontHistory.edit.endTime") }}</h2>
							<p>{{ formatDate(frontingEntry.endTime, true) }}</p>
						</IonLabel>
						<DatePopupPicker
							v-model="endTime"
							showDefaultButtons
							ref="endTimePicker"
							:title="$t('options.frontHistory.edit.startTime')"
							:min="frontingEntry.startTime"
						/>
					</IonItem>
					<IonItem button>
						<IonToggle v-model="frontingEntry.isMainFronter">
							<IonLabel>
								{{ $t("options:frontHistory.edit.isMainFronter") }}
							</IonLabel>
						</IonToggle>
					</IonItem>
					<IonItem button v-if="frontingEntry.uuid" @click="_deleteFrontingEntry">
						<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" color="danger"/>
						<IonLabel color="danger">
							<h3>{{ $t("options:frontHistory.edit.delete.title") }}</h3>
							<p>{{ $t("other:genericDeleteDesc") }}</p>
						</IonLabel>
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="frontingEntry.member">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>

			<MemberSelect :onlyOne="true" :model-value="frontingEntry.member ? [frontingEntry.member] : []" @update:model-value="(e) => { if(e[0]) frontingEntry.member = e[0] }" ref="memberSelectModal" />
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.fronting-entry-edit-modal {
		--height: 50dvh;
		--min-height: 600px;
		--border-radius: 16px;
	}

	ion-content {
		--padding-bottom: 80px;
	}

	.md ion-input {
		margin: 16px 0;
	}
</style>