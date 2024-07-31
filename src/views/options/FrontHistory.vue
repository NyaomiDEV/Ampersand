<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton} from '@ionic/vue';
	import { inject, provide, ref, toRaw } from 'vue';
	import FrontingEntryInList from '../../components/FrontingEntryInList.vue';
	import { frontingEntries, FrontingEntryComplete } from '../../lib/db/entities/frontingEntries';
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";

	const isIOS = inject<boolean>("isIOS");

	const frontingEntry = ref();
	provide("frontingEntry", frontingEntry);

	const isOpen = ref(false);
	provide("isOpen", isOpen);

	function showModal(clickedFrontingEntry: FrontingEntryComplete){
		frontingEntry.value = {...clickedFrontingEntry};
		isOpen.value = true;
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
				<FrontingEntryInList v-for="entry in frontingEntries.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())" :entry @entryClicked="showModal(entry)" />
			</IonList>
		</IonContent>

		<FrontingEntryEdit />
	</IonPage>
</template>
