<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonLabel, IonToolbar, IonBackButton, IonItem, IonItemDivider, IonDatetime, IonButtons, IonIcon, IonButton} from '@ionic/vue';
	import { inject, provide, ref } from 'vue';
	import FrontingEntryAvatar from "../../components/frontingEntry/FrontingEntryAvatar.vue";
	import FrontingEntryLabel from "../../components/frontingEntry/FrontingEntryLabel.vue";
	import { frontingEntries, FrontingEntryComplete } from '../../lib/db/entities/frontingEntries';
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import dayjs from 'dayjs';

	import {
		calendarOutline as calendarIOS,
		listOutline as listIOS
	} from "ionicons/icons";

	import calendarMD from "@material-design-icons/svg/outlined/calendar_month.svg";
	import listMD from "@material-design-icons/svg/outlined/list.svg";

	const isIOS = inject<boolean>("isIOS");
	const frontingEntryModal = ref();
	const frontingEntry = ref();

	const isCalendarView = ref(false);
	const date = ref(dayjs().toISOString());

	provide("frontingEntry", frontingEntry);

	async function showModal(clickedFrontingEntry: FrontingEntryComplete){
		frontingEntry.value = {...clickedFrontingEntry};
		await frontingEntryModal.value.$el.present();
	}

	function getGrouped(entries: FrontingEntryComplete[]){
		const map = new Map<string, FrontingEntryComplete[]>();

		for(const entry of entries.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())){
			const key = entry.endTime ? dayjs(entry.startTime).startOf('day').toISOString() : "currentlyFronting";
			
			const collection = map.get(key);
			if(!collection)
				map.set(key, [entry])
			else
				collection.push(entry)
		}

		return map;
	}

	function getAtDate(_date: string){
		const today = dayjs().startOf("day");
		const date = dayjs(_date).startOf("day");

		const map = new Map<string, FrontingEntryComplete[]>();

		if(date.valueOf() === today.valueOf())
			map.set("currentlyFronting", frontingEntries.value.filter(x => !x.endTime));

		const key = date.toISOString();

		map.set(key, frontingEntries.value.filter(x => x.endTime && dayjs(x.startTime).startOf('day').valueOf() === date.valueOf()));

		return map;
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:frontHistory.header") }}
				</IonTitle>
				<IonButtons slot="secondary">
					<IonButton @click="isCalendarView = !isCalendarView">
						<IonIcon slot="icon-only" :ios="isCalendarView ? listIOS : calendarIOS" :md="isCalendarView ? listMD : calendarMD" />
					</IonButton>
				</IonButtons>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<div class="container">
				<IonDatetime presentation="date" @ionChange="(e) => date = e.detail.value as string" v-if="isCalendarView" />
			</div>

			<IonList :inset="isIOS" v-if="isCalendarView">
				<template v-for="tuple in getAtDate(date)">
					<IonItemDivider sticky v-if="tuple[1].length">
						<IonLabel>{{
							tuple[0] === "currentlyFronting"
								? $t("options:frontHistory.currentlyFronting")
								: dayjs(tuple[0]).format("LL")
						}}</IonLabel>
					</IonItemDivider>
					<IonItem button v-for="entry in tuple[1]" @click="showModal(entry)" >
						<FrontingEntryAvatar slot="start" :entry />
						<FrontingEntryLabel :entry />
					</IonItem>
				</template>
			</IonList>

			<IonList :inset="isIOS" v-if="!isCalendarView">
				<template v-for="tuple in getGrouped(frontingEntries)">
					<IonItemDivider sticky>
						<IonLabel>{{
							tuple[0] === "currentlyFronting"
								? $t("options:frontHistory.currentlyFronting")
								: dayjs(tuple[0]).format("LL")
						}}</IonLabel>
					</IonItemDivider>
					<IonItem button v-for="entry in tuple[1]" @click="showModal(entry)" >
						<FrontingEntryAvatar slot="start" :entry />
						<FrontingEntryLabel :entry />
					</IonItem>
				</template>
			</IonList>
		</IonContent>

		<FrontingEntryEdit ref="frontingEntryModal"/>
	</IonPage>
</template>

<style scoped>
	.container {
		background-color: var(--ion-background-color-step-50);
		z-index: 1;
	}

	ion-datetime {
		margin: auto;
		--background: var(--ion-background-color-step-50);
	}
</style>