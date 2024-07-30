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
	import { Ref, WatchStopHandle, inject, ref, toRaw, watch } from "vue";

	import dayjs from "dayjs";
	import UTC from "dayjs/plugin/utc";
	import Timezone from "dayjs/plugin/timezone";
	dayjs.extend(UTC);
	dayjs.extend(Timezone);

	const isOpen = inject<Ref<boolean>>("isOpen")!;
	const frontingEntry = inject<Ref<FrontingEntryComplete>>("frontingEntry")!;

	const startTime = ref();
	const endTime = ref();

	const watchStopHandles: WatchStopHandle[] = [];
	watch(frontingEntry, () => {
		if(!frontingEntry.value) return;
		watchStopHandles.forEach(x => x());

		console.log(frontingEntry.value.startTime, dayjs(dayjs(frontingEntry.value.startTime).format("YYYY-MM-DDTHH:mm:ss")).toDate());

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
	}, {immediate: false});

	function dismiss(){
		if(isOpen)
			isOpen.value = false;
	}

	async function save(){
		if(!frontingEntry.value) return;

		const uuid = frontingEntry.value?.uuid;
		const _frontingEntry = toRaw(frontingEntry.value);

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
		if(!frontingEntry.value) return;
	}
</script>

<template>
	<IonModal class="sheet-modal" :isOpen @willPresent="present" @didDismiss="dismiss" :breakpoints="[0,1]" initialBreakpoint="1" v-if="frontingEntry">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("options:frontHistory.edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
					<IonItem button lines="none">
						<IonLabel>
							{{ $t("options:frontHistory.edit.startTime") }}
						</IonLabel>
						<IonDatetimeButton slot="end" datetime="startTime"></IonDatetimeButton>
						<IonModal class="stack-modal" :keep-contents-mounted="true">
							<IonDatetime id="startTime" v-model="startTime"/>
						</IonModal>
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
						<IonModal class="stack-modal" :keep-contents-mounted="true">
							<IonDatetime id="endTime" v-model="endTime"/>
						</IonModal>
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
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.stack-modal {
		--backdrop-opacity: var(--ion-backdrop-opacity, 0.32) !important;
		--border-radius: 16px;
	}

	ion-modal.sheet-modal {
		--height: 50%;
		--border-radius: 16px;
	}

	ion-content {
		--padding-bottom: 80px;
	}
</style>