<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonLabel, IonToolbar, IonBackButton, IonItem, IonItemDivider} from '@ionic/vue';
	import { inject, provide, ref } from 'vue';
	import FrontingEntryAvatar from "../../components/frontingEntry/FrontingEntryAvatar.vue";
	import FrontingEntryLabel from "../../components/frontingEntry/FrontingEntryLabel.vue";
	import { frontingEntries, FrontingEntryComplete } from '../../lib/db/entities/frontingEntries';
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import dayjs from 'dayjs';

	const isIOS = inject<boolean>("isIOS");
	const frontingEntryModal = ref();

	const frontingEntry = ref();
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
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:frontHistory.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">
				<template v-for="tuple in getGrouped(frontingEntries)" >
					<IonItemDivider>
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
