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

	import { FrontingEntryComplete, getTable } from '../lib/db/entities/frontingEntries';
	import { Ref, ShallowReactive, WatchStopHandle, inject, provide, ref, shallowReactive, toRaw, watch } from "vue";

	import MemberSelect from "./MemberSelect.vue";
	import MemberAvatar from "../components/member/MemberAvatar.vue";

	import dayjs from "dayjs";
	import UTC from "dayjs/plugin/utc";
	import Timezone from "dayjs/plugin/timezone";
	import { Member } from "../lib/db/entities/members";
	dayjs.extend(UTC);
	dayjs.extend(Timezone);

	const isOpen = inject<Ref<boolean>>("isOpen")!;
	const frontingEntry = inject<Ref<FrontingEntryComplete>>("frontingEntry")!;

	const memberSelectModal = ref();

	const selectedMembers: ShallowReactive<Member[]> = shallowReactive([]);
	provide("selectedMembers", selectedMembers);

	const startTime: Ref<string | undefined> = ref();
	const endTime: Ref<string | undefined> = ref();

	const watchStopHandles: WatchStopHandle[] = [];

	function dismiss(){
		if(isOpen)
			isOpen.value = false;
	}

	async function save(){
		if(!frontingEntry.value) return;

		const uuid = frontingEntry.value?.uuid;
		const _frontingEntry = toRaw(frontingEntry.value);

		console.log(selectedMembers, _frontingEntry.member.uuid);

		await getTable().update(uuid, {
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

		await getTable().delete(frontingEntry.value.uuid);
		try{
			await modalController.dismiss(undefined, "deleted");
		}catch(_){}
	}

	function present() {
		watchStopHandles.forEach(x => x());
		watchStopHandles.length = 0;

		if(!frontingEntry.value) return;

		selectedMembers.push(frontingEntry.value.member);

		startTime.value = dayjs(frontingEntry.value.startTime).format("YYYY-MM-DDTHH:mm:ss");

		if(frontingEntry.value.endTime)
			endTime.value = dayjs(frontingEntry.value.endTime).format("YYYY-MM-DDTHH:mm:ss");

		watchStopHandles.push(
			watch(selectedMembers, () => {
				console.log(selectedMembers, frontingEntry.value.member.uuid);
				if(selectedMembers.length)
					frontingEntry.value.member = selectedMembers[0];
			}, {immediate: false}),
			watch(startTime, () => {
				frontingEntry.value.startTime = dayjs(startTime.value).toDate();
			}, {immediate: false}),
			watch(endTime, () => {
				if(endTime.value)
					frontingEntry.value.endTime = dayjs(endTime.value).toDate();
			}, {immediate: false})
		);
	}

	function didPresent() {
		setTimeout(() => {
			console.log()
		}, 2000);
	}
</script>

<template>
	<IonModal class="fronting-entry-edit-modal" :isOpen @willPresent="present" @didPresent="didPresent" @didDismiss="dismiss" :breakpoints="[0,1]" initialBreakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("options:frontHistory.edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
					<IonItem button lines="none" @click="memberSelectModal.$el.present()">
						<MemberAvatar slot="start" :member="frontingEntry.member" />
						<IonLabel>
							<h2>{{ frontingEntry.member.name }}</h2>
							<p>{{ $t("options:frontHistory.edit.member") }}</p>
						</IonLabel>
					</IonItem>
					<IonItem lines="none">
						<IonInput mode="md" fill="outline" :label="$t('options:frontHistory.edit.customStatus')" labelPlacement="floating" v-model="frontingEntry.customStatus" />
					</IonItem>
					<IonItem button lines="none">
						<IonLabel>
							{{ $t("options:frontHistory.edit.startTime") }}
						</IonLabel>
						<IonDatetimeButton slot="end" datetime="startTime"></IonDatetimeButton>
					</IonItem>
					<IonItem lines="none" v-if="!frontingEntry.endTime">
						<IonLabel>
							<p>
								{{ $t("options:frontHistory.edit.endTimeUnavailable") }}
							</p>
						</IonLabel>
					</IonItem>
					<IonItem button lines="none" v-if="frontingEntry.endTime">
						<IonLabel>
							{{ $t("options:frontHistory.edit.endTime") }}
						</IonLabel>
						<IonDatetimeButton slot="end" datetime="endTime"></IonDatetimeButton>
					</IonItem>
					<IonItem button lines="none">
						<IonToggle v-model="frontingEntry.isMainFronter">
							<IonLabel>
								{{ $t("options:frontHistory.edit.isMainFronter") }}
							</IonLabel>
						</IonToggle>
					</IonItem>
					<IonItem button lines="none" @click="deleteFrontingEntry">
						<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" />
						<IonLabel>
							<h3>{{ $t("options:frontHistory.edit.delete.title") }}</h3>
							<p>{{ $t("options:frontHistory.edit.delete.desc") }}</p>
						</IonLabel>
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>

			<MemberSelect :onlyOne="true" ref="memberSelectModal" />
			<IonModal class="stack-modal" :keep-contents-mounted="true">
				<IonDatetime id="startTime" v-model="startTime" :showDefaultButtons="true">
					<span slot="title">{{ $t("options:frontHistory.edit.startTime") }}</span>
				</IonDatetime>
			</IonModal>
			<IonModal class="stack-modal" :keep-contents-mounted="true">
				<IonDatetime id="endTime" v-model="endTime" :showDefaultButtons="true">
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
		--min-height: 512px;
		--border-radius: 16px;
	}

	ion-content {
		--padding-bottom: 80px;
	}

	ion-input {
		margin: 16px 0;
	}
</style>