<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonItem} from '@ionic/vue';
	import { inject, provide, ref } from 'vue';
	import FrontingEntryAvatar from "../../components/frontingEntry/FrontingEntryAvatar.vue";
	import FrontingEntryLabel from "../../components/frontingEntry/FrontingEntryLabel.vue";
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
				<IonItem button v-for="entry in frontingEntries.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())" @click="showModal(entry)" >
					<FrontingEntryAvatar slot="start" :entry />
					<FrontingEntryLabel :entry />
				</IonItem>
			</IonList>
		</IonContent>

		<FrontingEntryEdit />
	</IonPage>
</template>
