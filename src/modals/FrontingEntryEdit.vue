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
		IonModal,
		IonDatetimeButton,
		IonDatetime
	} from "@ionic/vue";

	import {
		saveOutline as saveIOS,
		trashBinOutline as trashIOS
	} from "ionicons/icons";

	import saveMD from "@material-design-icons/svg/outlined/save.svg";
	import trashMD from "@material-design-icons/svg/outlined/delete.svg";

	import { FrontingEntryComplete, getFrontingEntriesTable, newFrontingEntry } from '../lib/db/entities/frontingEntries';
	import { Ref, ShallowReactive, WatchStopHandle, inject, ref, shallowReactive, toRaw, watch } from "vue";

	import MemberSelect from "./MemberSelect.vue";
	import MemberAvatar from "../components/member/MemberAvatar.vue";

	import dayjs from "dayjs";
	import UTC from "dayjs/plugin/utc";
	import Timezone from "dayjs/plugin/timezone";
	import { Member } from "../lib/db/entities/members";
	import { appConfig } from "../lib/config";
	import { PartialBy } from "../lib/db/types";
	dayjs.extend(UTC);
	dayjs.extend(Timezone);

	const isIOS = inject<boolean>("isIOS");

	const twelveHourClock = appConfig.locale.twelveHourClock;
	const firstWeekOfDayIsSunday = appConfig.locale.firstWeekOfDayIsSunday;

	const props = defineProps<{
		frontingEntry: PartialBy<FrontingEntryComplete, "uuid" | "member">
	}>();

	const frontingEntry = ref(props.frontingEntry);

	const memberSelectModal = ref();

	const selectedMembers: ShallowReactive<Member[]> = shallowReactive([]);

	const startTime: Ref<string | undefined> = ref();
	const endTime: Ref<string | undefined> = ref();

	const watchStopHandles: WatchStopHandle[] = [];

	async function save(){
		const uuid = frontingEntry.value?.uuid;
		const _frontingEntry = toRaw(frontingEntry.value);

		if(!_frontingEntry.member) return;

		if(!uuid) {
			await newFrontingEntry({..._frontingEntry, member: _frontingEntry.member.uuid });

			await modalController.dismiss(null, "added");

			return;
		}

		await getFrontingEntriesTable().update(uuid, {
			..._frontingEntry,
			member: _frontingEntry.member.uuid
		});

		try{
			await modalController.dismiss(null, "modified");
		}catch(_){}
		// catch an error because the type might get changed, causing the parent to be removed from DOM
		// however it's safe for us to ignore
	}

	async function deleteFrontingEntry(){
		if(!frontingEntry.value) return;

		await getFrontingEntriesTable().delete(frontingEntry.value.uuid);
		try{
			await modalController.dismiss(undefined, "deleted");
		}catch(_){}
	}

	function present() {
		frontingEntry.value = props.frontingEntry;

		selectedMembers.length = 0;
		if(frontingEntry.value.member)
			selectedMembers.push(frontingEntry.value.member);

		startTime.value = dayjs(frontingEntry.value.startTime).format("YYYY-MM-DDTHH:mm:ss");

		if(frontingEntry.value.endTime)
			endTime.value = dayjs(frontingEntry.value.endTime).format("YYYY-MM-DDTHH:mm:ss");

		watchStopHandles.push(
			watch(startTime, () => {
				frontingEntry.value.startTime = dayjs(startTime.value).toDate();
			}, {immediate: false}),
			watch(endTime, () => {
				if(endTime.value)
					frontingEntry.value.endTime = dayjs(endTime.value).toDate();
			}, {immediate: false})
		);
	}

	function dismiss(){
		watchStopHandles.forEach(x => x());
		watchStopHandles.length = 0;
	}

	function updateSelectedMember(members: Member[]){
		frontingEntry.value.member = members[0];
	}

	function removeFromFront() {
		frontingEntry.value.endTime = new Date();
	}
</script>

<template>
	<IonModal class="fronting-entry-edit-modal" @willPresent="present" @willDismiss="dismiss" :breakpoints="[0,1]" initialBreakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("options:frontHistory.edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
					<IonItem button @click="memberSelectModal.$el.present()">
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
					<IonItem button>
						<IonLabel>
							{{ $t("options:frontHistory.edit.startTime") }}
						</IonLabel>
						<IonDatetimeButton slot="end" datetime="startTime"></IonDatetimeButton>
					</IonItem>
					<IonItem button v-if="!frontingEntry.endTime" @click="removeFromFront">
						<IonLabel>
							<h2>{{ $t("options:frontHistory.edit.removeFromFront.title") }}</h2>
							<p>{{ $t("options:frontHistory.edit.removeFromFront.desc") }}</p>
						</IonLabel>
					</IonItem>
					<IonItem button v-if="frontingEntry.endTime">
						<IonLabel>
							{{ $t("options:frontHistory.edit.endTime") }}
						</IonLabel>
						<IonDatetimeButton slot="end" datetime="endTime"></IonDatetimeButton>
					</IonItem>
					<IonItem button>
						<IonToggle v-model="frontingEntry.isMainFronter">
							<IonLabel>
								{{ $t("options:frontHistory.edit.isMainFronter") }}
							</IonLabel>
						</IonToggle>
					</IonItem>
					<IonItem button v-if="frontingEntry.uuid" @click="deleteFrontingEntry">
						<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" color="danger"/>
						<IonLabel color="danger">
							<h3>{{ $t("options:frontHistory.edit.delete.title") }}</h3>
							<p>{{ $t("options:frontHistory.edit.delete.desc") }}</p>
						</IonLabel>
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="frontingEntry.member">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>

			<MemberSelect :selectedMembers :onlyOne="true" @selectedMembers="updateSelectedMember" ref="memberSelectModal" />
			<IonModal class="stack-modal" :keep-contents-mounted="true">
				<IonDatetime id="startTime" v-model="startTime" :showDefaultButtons="true" :hourCycle="twelveHourClock ? 'h12' : 'h23'" :firstDayOfWeek="firstWeekOfDayIsSunday ? 0 : 1">
					<span slot="title">{{ $t("options:frontHistory.edit.startTime") }}</span>
				</IonDatetime>
			</IonModal>
			<IonModal class="stack-modal" :keep-contents-mounted="true">
				<IonDatetime id="endTime" v-model="endTime" :showDefaultButtons="true" :hourCycle="twelveHourClock ? 'h12' : 'h23'" :firstDayOfWeek="firstWeekOfDayIsSunday ? 0 : 1">
					<span slot="title">{{ $t("options:frontHistory.edit.endTime") }}</span>
				</IonDatetime>
			</IonModal>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.stack-modal {
		--backdrop-opacity: var(--ion-backdrop-opacity, 0.32) !important;
		--border-radius: 16px;
	}

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