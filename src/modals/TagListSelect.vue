<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonList,
		IonItem,
		IonModal,
		IonSearchbar,
		IonCheckbox,
		CheckboxCustomEvent,
	} from "@ionic/vue";

	import { inject, ref } from "vue";
	import { getFilteredTags } from "../lib/db/liveQueries";
	import { Tag } from "../lib/db/entities/tags";
	import TagColor from "../components/tag/TagColor.vue";
	import TagLabel from "../components/tag/TagLabel.vue";

	const isIOS = inject<boolean>("isIOS");

	const props = defineProps<{
		selectedTags: Tag[]
	}>();

	const emit = defineEmits<{
		selectedTags: [Tag[]]
	}>();

	const selectedTags = props.selectedTags;
	
	function check(ev: CheckboxCustomEvent){
		if(ev.detail.checked)
			selectedTags.push(filteredTags.find(x => x.uuid === ev.detail.value)!);
		else {
			const index = selectedTags.findIndex(x => x.uuid === ev.detail.value);
			if(index > -1)
				selectedTags.splice(index, 1);
		}
	}

	function dismiss(){
		emit("selectedTags", [...selectedTags]);
	}

	const search = ref("");
	const filteredTags = getFilteredTags(search, ref("member"));
</script>

<template>
	<IonModal class="tag-select-modal" :breakpoints="[0,0.25,0.5,1]" initialBreakpoint="0.25" @willDismiss="dismiss">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("other:taglistSelect:header") }}</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('options:tagManagement.searchPlaceholder')"
					showCancelButton="focus" showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList :inset="isIOS">
				<IonItem button v-for="tag in filteredTags" :key="JSON.stringify(tag)">
					<TagColor slot="start" :tag />
					<IonCheckbox :value="tag.uuid" :checked="!!selectedTags.find(x => x.uuid === tag.uuid)" @ionChange="check">
						<TagLabel :tag />
					</IonCheckbox>
				</IonItem>
			</IonList>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.tag-select-modal {
		--height: 100dvh;
		--border-radius: 16px;
	}

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