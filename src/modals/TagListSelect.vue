<script setup lang="ts">
	import {
		IonAvatar,
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonButton,
		IonIcon,
		IonLabel,
		IonList,
		IonItem,
		IonModal,
		IonSearchbar,
		IonButtons,
		IonCheckbox,
		CheckboxCustomEvent,
	} from "@ionic/vue";

	import {
		chevronBack as backIOS,
	} from "ionicons/icons";

	import backMD from "@material-design-icons/svg/outlined/arrow_back.svg";

	import { inject, Ref, ref, toRaw } from "vue";
	import { getFilteredTags } from "../lib/db/liveQueries";
	import { UUID } from "../lib/db/types";

	const isTagListSelectionOpen = inject<Ref<boolean>>("isTagListSelectionOpen");

	const props = defineProps<{
		tags?: UUID[]
	}>();
	
	async function dismiss(){
		if(isTagListSelectionOpen){
			props.tags!.length = 0;
			props.tags!.push(...toRaw(selectedTags.value));
			isTagListSelectionOpen.value = false;
		}
	}

	function check(ev: CheckboxCustomEvent){
		if(ev.detail.checked)
			selectedTags.value.push(ev.detail.value);
		else {
			const index = selectedTags.value.indexOf(ev.detail.value);
			if(index > -1)
				selectedTags.value.splice(index, 1);
		}
	}

	const search = ref("");
	const filteredTags = getFilteredTags(search, ref("member"));

	const selectedTags: Ref<UUID[]> = ref([...props.tags || []]);
</script>

<template>
	<IonModal @didDismiss="dismiss">
		<IonHeader>
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton shape="round" fill="clear" @click="dismiss">
						<IonIcon slot="icon-only" :md="backMD" :ios="backIOS"></IonIcon>
					</IonButton>
				</IonButtons>
				<IonTitle>Tag select</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('options:tagManagement.searchPlaceholder')"
					showCancelButton="focus" showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
				<IonItem button v-for="tag in filteredTags" :key="tag.uuid">
					<IonAvatar slot="start" v-if="tag.color">
						<div :style="{
							backgroundColor: tag.color
						}"></div>
					</IonAvatar>
					<IonCheckbox :value="tag.uuid" :checked="selectedTags.includes(tag.uuid)" @ionChange="check">
						{{ tag.name }}
					</IonCheckbox>
				</IonItem>
			</IonList>
		</IonContent>
	</IonModal>
</template>

<style scoped>
div {
	position: relative;
	top: 15%;
	left: 15%;
	width: 75%;
	height: 75%;
	border-radius: 100%;
	aspect-ratio: 1;
}
</style>